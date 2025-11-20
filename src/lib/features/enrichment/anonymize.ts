/**
 * IP ANONYMIZATION
 *
 * GDPR-compliant IP hashing
 * Store hash instead of raw IP in production
 */

import { CONFIG } from '@/lib/config';
import { logger } from '@/lib/utils/logger';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

/**
 * Anonymize IP address
 * Returns hash in production, raw IP in development
 */
export function anonymizeIP(ip: string): { raw: string | null; hash: string } {
  if (!CONFIG.features.ipAnonymization) {
    // Development mode: store raw IP
    return { raw: ip, hash: '' };
  }

  // Production mode: hash IP
  const hash = sha256(new TextEncoder().encode(ip));
  const hashHex = bytesToHex(hash);

  logger.debug('Enrichment', 'IP anonymized', {
    ipPrefix: ip.substring(0, 7), // Log first 7 chars for debug
  });

  return {
    raw: CONFIG.features.ipLogging ? ip : null, // Only if explicitly enabled
    hash: hashHex,
  };
}

/**
 * Get IP from request headers
 */
export function getIPFromRequest(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Check if IP is from Cloudflare
 */
export function isCloudflareIP(request: Request): boolean {
  return !!request.headers.get('CF-Ray');
}

/**
 * Get country from Cloudflare headers
 */
export function getCountryFromRequest(request: Request): string | null {
  return request.headers.get('CF-IPCountry');
}
