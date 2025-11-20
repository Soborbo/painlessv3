/**
 * RATE LIMITING
 *
 * Uses Cloudflare KV
 * Hash-based key (IP + UserAgent) for better granularity
 */

import { CONFIG } from '@/lib/config';
import { generateRateLimitKey } from '@/lib/utils/fingerprint';
import { kvGet, kvPut, safeKV } from '@/lib/utils/kv';
import { logger } from '@/lib/utils/logger';
import type { APIContext } from 'astro';

/**
 * Check rate limit
 */
export async function checkRateLimit(context: APIContext): Promise<boolean> {
  if (!CONFIG.features.rateLimiting) {
    return true; // Feature disabled
  }

  const { locals, request } = context;
  const runtime = locals.runtime as any;

  const kv = safeKV(runtime?.env, 'RATE_LIMITER');
  if (!kv) {
    logger.warn('RateLimit', 'KV not configured, allowing request');
    return true;
  }

  // Get IP address
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
    'unknown';

  if (ip === 'unknown') {
    logger.warn('RateLimit', 'Could not determine IP');
    return true;
  }

  // Get UserAgent for better granularity
  const userAgent = request.headers.get('User-Agent') || undefined;

  // Generate hash-based key
  const keyHash = generateRateLimitKey(ip, userAgent);
  const env = CONFIG.debug ? 'dev' : 'prod';
  const key = `rate_limit:${env}:${keyHash}`;

  try {
    const current = await kvGet<string>(kv, key);

    if (!current) {
      // First request
      await kvPut(kv, key, '1', {
        expirationTtl: Math.floor(CONFIG.security.rateLimitWindowMs / 1000),
      });
      return true;
    }

    const count = Number.parseInt(current, 10);

    if (Number.isNaN(count)) {
      logger.warn('RateLimit', 'Invalid counter, resetting', { key });
      await kvPut(kv, key, '1', {
        expirationTtl: Math.floor(CONFIG.security.rateLimitWindowMs / 1000),
      });
      return true;
    }

    if (count >= CONFIG.security.rateLimitRequests) {
      logger.warn('RateLimit', 'Limit exceeded', {
        ip,
        count,
        limit: CONFIG.security.rateLimitRequests,
      });
      return false;
    }

    // Increment
    await kvPut(kv, key, String(count + 1), {
      expirationTtl: Math.floor(CONFIG.security.rateLimitWindowMs / 1000),
    });

    return true;
  } catch (error) {
    logger.error('RateLimit', 'Check failed', { error });
    // Fail open (allow request)
    return true;
  }
}

/**
 * Get remaining requests
 */
export async function getRemainingRequests(context: APIContext): Promise<number> {
  const { locals, request } = context;
  const runtime = locals.runtime as any;

  const kv = safeKV(runtime?.env, 'RATE_LIMITER');
  if (!kv) return CONFIG.security.rateLimitRequests;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || undefined;
  const keyHash = generateRateLimitKey(ip, userAgent);
  const env = CONFIG.debug ? 'dev' : 'prod';
  const key = `rate_limit:${env}:${keyHash}`;

  try {
    const current = await kvGet<string>(kv, key);
    if (!current) return CONFIG.security.rateLimitRequests;

    const count = Number.parseInt(current, 10);
    return Math.max(0, CONFIG.security.rateLimitRequests - count);
  } catch {
    return CONFIG.security.rateLimitRequests;
  }
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(errorId: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      errorId,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(CONFIG.security.rateLimitWindowMs / 1000),
      },
    }
  );
}
