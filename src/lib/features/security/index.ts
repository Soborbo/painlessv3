/**
 * SECURITY FEATURE
 *
 * Central security utilities
 */

import { CONFIG } from '@/lib/config';
import { logger } from '@/lib/utils/logger';

// Re-export security functions
export {
  checkRateLimit,
  getRemainingRequests,
  createRateLimitResponse,
} from './rate-limit';
export { checkPayloadSize, createPayloadTooLargeResponse } from './payload-limit';

let _initialized = false;

/**
 * Initialize security feature
 */
export async function initSecurity(): Promise<void> {
  if (_initialized) return;

  logger.info('Security', 'Initializing...');

  try {
    // Security features are always-on, just mark as ready
    _initialized = true;
    logger.info('Security', '✓ Initialized');
  } catch (error) {
    logger.error('Security', 'Initialization failed', { error });
  }
}

/**
 * Validate request origin
 */
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = CONFIG.security.allowedOrigins;
  return allowedOrigins.includes(origin);
}

/**
 * Check if request is from bot (basic)
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, expected: string): boolean {
  if (!token || !expected) return false;

  // Constant-time comparison
  if (token.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return result === 0;
}
