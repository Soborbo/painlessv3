/**
 * SAVE QUOTE ENDPOINT
 *
 * Features:
 * - Payload size limit
 * - Fingerprint duplicate prevention
 * - IP anonymization (GDPR)
 * - Email with timeout
 * - Rate limiting
 */

import { getRuntimeConfig } from '@/lib/config';
import { CONFIG } from '@/lib/config';
import { createDbClient } from '@/lib/core/db/client';
import { createQuote, getQuoteByFingerprint } from '@/lib/core/db/queries';
import { sendEmail } from '@/lib/core/email/sender';
import {
  generateAdminNotificationEmail,
  generateQuoteConfirmationEmail,
} from '@/lib/core/email/templates';
import { saveQuoteSchema } from '@/lib/core/validations/schemas';
import { getDeviceInfo } from '@/lib/features/enrichment';
import { anonymizeIP, getIPFromRequest } from '@/lib/features/enrichment/anonymize';
import {
  checkPayloadSize,
  createPayloadTooLargeResponse,
} from '@/lib/features/security/payload-limit';
import { checkRateLimit, createRateLimitResponse } from '@/lib/features/security/rate-limit';
import { getCORSHeaders } from '@/lib/utils/cors';
import { createErrorResponse, formatError, generateErrorId } from '@/lib/utils/error';
import { generateFingerprint } from '@/lib/utils/fingerprint';
import { logger } from '@/lib/utils/logger';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  const runtime = context.locals.runtime as any;
  const errorId = generateErrorId();
  const origin = context.request.headers.get('Origin');
  const corsHeaders = getCORSHeaders(origin);

  logger.info('API', 'Save quote request received');

  // 1. Payload size check
  const payloadOk = await checkPayloadSize(context);
  if (!payloadOk) {
    return createPayloadTooLargeResponse(errorId);
  }

  // 2. Rate limit
  const rateLimitOk = await checkRateLimit(context);
  if (!rateLimitOk) {
    return createRateLimitResponse(errorId);
  }

  try {
    // 3. Parse and validate
    const body = await context.request.json();
    const validated = saveQuoteSchema.parse(body);

    logger.debug('API', 'Quote data validated');

    // 4. Get runtime config
    const runtimeConfig = getRuntimeConfig(runtime.env);

    // 5. Create DB client
    const db = createDbClient({
      TURSO_DATABASE_URL: runtime.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: runtime.env.TURSO_AUTH_TOKEN,
    });

    // 6. Generate fingerprint for duplicate prevention
    const fingerprint = generateFingerprint({
      data: validated.data,
      totalPrice: validated.totalPrice,
    });

    // 7. Check for duplicate
    const existing = await getQuoteByFingerprint(db, fingerprint);

    if (existing) {
      logger.warn('API', 'Duplicate quote detected', {
        fingerprint,
        existingId: existing.id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          quoteId: existing.id,
          duplicate: true,
          message: 'This quote was already submitted',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // 8. Get and anonymize IP (GDPR)
    const rawIP = getIPFromRequest(context.request);
    const { raw: ipAddress, hash: ipAddressHash } = anonymizeIP(rawIP);

    // 9. Get enrichment data
    const country = context.request.headers.get('CF-IPCountry');
    const userAgent = context.request.headers.get('User-Agent');
    const deviceInfo = getDeviceInfo(userAgent);

    // 10. Extract UTM params from referrer or query
    const url = new URL(context.request.url);
    const utmSource = validated.utm_source || url.searchParams.get('utm_source') || undefined;
    const utmMedium = validated.utm_medium || url.searchParams.get('utm_medium') || undefined;
    const utmCampaign = validated.utm_campaign || url.searchParams.get('utm_campaign') || undefined;
    const gclid = validated.gclid || url.searchParams.get('gclid') || undefined;

    // 11. Save to database
    const quote = await createQuote(db, {
      schemaVersion: CONFIG.calculator.schemaVersion,
      fingerprint,
      calculatorData: validated.data,
      totalPrice: validated.totalPrice,
      currency: validated.currency,
      breakdown: validated.breakdown,
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      language: validated.language,
      ipAddress,
      ipAddressHash,
      country,
      userAgent,
      device: deviceInfo.type,
      utmSource,
      utmMedium,
      utmCampaign,
      gclid,
    });

    if (!quote) {
      throw new Error('Failed to save quote to database');
    }

    logger.info('API', 'Quote saved', { quoteId: quote.id });

    // 12. Send confirmation email (if email provided)
    if (validated.email) {
      try {
        const emailHtml = generateQuoteConfirmationEmail(
          quote,
          runtimeConfig.site.url || CONFIG.site.url || 'https://your-domain.com'
        );

        await sendEmail(
          {
            to: validated.email,
            subject: `Your Quote Confirmation - #${quote.id}`,
            html: emailHtml,
          },
          runtimeConfig.email
        );

        logger.info('Email', 'Confirmation sent', { quoteId: quote.id });
      } catch (emailError) {
        logger.error('Email', 'Failed to send confirmation', {
          error: emailError,
          quoteId: quote.id,
        });
        // Don't fail the request if email fails
      }
    }

    // 13. Send admin notification (optional)
    if (CONFIG.calculator.emailSupport) {
      try {
        const adminEmailHtml = generateAdminNotificationEmail(
          quote,
          runtimeConfig.site.url || CONFIG.site.url || 'https://your-domain.com'
        );

        await sendEmail(
          {
            to: CONFIG.calculator.emailSupport,
            subject: `New Quote Request #${quote.id}`,
            html: adminEmailHtml,
          },
          runtimeConfig.email
        );

        logger.info('Email', 'Admin notification sent', { quoteId: quote.id });
      } catch (emailError) {
        logger.error('Email', 'Failed to send admin notification', {
          error: emailError,
        });
        // Don't fail the request if email fails
      }
    }

    // 14. Return success
    return new Response(
      JSON.stringify({
        success: true,
        quoteId: quote.id,
        message: 'Quote saved successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    logger.error('API', 'Save quote failed', formatError(error, errorId));

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation error',
          details: (error as any).issues,
          errorId,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return createErrorResponse('Failed to save quote', errorId, 500);
  }
};

// CORS preflight
export const OPTIONS: APIRoute = async (context) => {
  const origin = context.request.headers.get('Origin');
  const corsHeaders = getCORSHeaders(origin);

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};
