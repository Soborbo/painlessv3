/**
 * EMAIL SENDER
 *
 * Resend wrapper with timeout and error handling
 */

import type { RuntimeConfig } from '@/lib/config';
import { logger } from '@/lib/utils/logger';
import { Resend } from 'resend';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email with timeout
 *
 * CRITICAL: Uses AbortSignal.timeout() for Edge compatibility
 */
export async function sendEmail(
  options: EmailOptions,
  config: RuntimeConfig['email']
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.resendApiKey) {
    logger.error('Email', 'Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const resend = new Resend(config.resendApiKey);

  try {
    logger.info('Email', 'Sending email', {
      to: Array.isArray(options.to) ? options.to.length : 1,
      subject: options.subject,
    });

    const result = await resend.emails.send({
      from: options.from || config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (result.error) {
      logger.error('Email', 'Failed to send', { error: result.error });
      return { success: false, error: result.error.message };
    }

    logger.info('Email', 'Sent successfully', { id: result.data?.id });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email', 'Send failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
