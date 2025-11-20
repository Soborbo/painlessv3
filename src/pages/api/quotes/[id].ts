/**
 * GET QUOTE ENDPOINT
 *
 * Retrieve a single quote by ID
 */

import { createDbClient } from '@/lib/core/db/client';
import { getQuoteById } from '@/lib/core/db/queries';
import { getCORSHeaders } from '@/lib/utils/cors';
import { createErrorResponse, generateErrorId } from '@/lib/utils/error';
import { logger } from '@/lib/utils/logger';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const runtime = context.locals.runtime as any;
  const errorId = generateErrorId();
  const origin = context.request.headers.get('Origin');
  const corsHeaders = getCORSHeaders(origin);

  const id = context.params.id;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Quote ID is required',
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

  try {
    const quoteId = Number.parseInt(id, 10);

    if (Number.isNaN(quoteId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid quote ID',
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

    // Create DB client
    const db = createDbClient({
      TURSO_DATABASE_URL: runtime.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: runtime.env.TURSO_AUTH_TOKEN,
    });

    // Get quote
    const quote = await getQuoteById(db, quoteId);

    if (!quote) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Quote not found',
          errorId,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    logger.info('API', 'Quote retrieved', { quoteId: quote.id });

    // Remove sensitive data
    const sanitized = {
      id: quote.id,
      totalPrice: quote.totalPrice,
      currency: quote.currency,
      breakdown: quote.breakdown,
      language: quote.language,
      status: quote.status,
      createdAt: quote.createdAt,
    };

    return new Response(
      JSON.stringify({
        success: true,
        quote: sanitized,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300', // 5 minutes
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    logger.error('API', 'Get quote failed', { error, id });
    return createErrorResponse('Failed to retrieve quote', errorId, 500);
  }
};
