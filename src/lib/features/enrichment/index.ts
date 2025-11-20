/**
 * ENRICHMENT FEATURE
 *
 * IP geolocation, device detection, etc.
 */

import { CONFIG } from '@/lib/config';
import { logger } from '@/lib/utils/logger';

// Re-export anonymization
export {
  anonymizeIP,
  getIPFromRequest,
  isCloudflareIP,
  getCountryFromRequest,
} from './anonymize';

let _initialized = false;

/**
 * Initialize enrichment feature
 */
export async function initEnrichment(): Promise<void> {
  if (!CONFIG.features.ipEnrichment || _initialized) return;

  logger.info('Enrichment', 'Initializing...');

  try {
    // Nothing to initialize yet, just mark as ready
    _initialized = true;
    logger.info('Enrichment', '✓ Initialized');
  } catch (error) {
    logger.error('Enrichment', 'Initialization failed', { error });
  }
}

/**
 * Get device info from User-Agent
 */
export function getDeviceInfo(userAgent: string | null): {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string | null;
  browser: string | null;
} {
  if (!userAgent) {
    return { type: 'unknown', os: null, browser: null };
  }

  // Device type detection
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
  const isTablet = /Tablet|iPad/i.test(userAgent);

  let type: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'desktop';
  if (isMobile) type = 'mobile';
  else if (isTablet) type = 'tablet';

  // OS detection
  let os: string | null = null;
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS';

  // Browser detection
  let browser: string | null = null;
  if (/Chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/Safari/i.test(userAgent)) browser = 'Safari';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';

  return { type, os, browser };
}
