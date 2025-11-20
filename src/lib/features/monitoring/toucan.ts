/**
 * SENTRY/TOUCAN MONITORING
 * 
 * Edge-compatible error tracking
 * Placeholder - will be implemented when Sentry is enabled
 */

import { logger } from '@/lib/utils/logger';

/**
 * Initialize Sentry for request
 */
export function initSentry(
  _request: Request,
  _env: any,
  _context: any
): any | null {
  // Placeholder - implement when Sentry is enabled
  logger.debug('Monitoring', 'Sentry init (placeholder)');
  return null;
}

/**
 * Capture exception
 */
export function captureException(_error: Error, _context?: Record<string, unknown>): void {
  // Placeholder - implement when Sentry is enabled
  logger.debug('Monitoring', 'Capture exception (placeholder)');
}
