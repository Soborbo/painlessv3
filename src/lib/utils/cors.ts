/**
 * CORS HELPER
 *
 * Generate CORS headers based on config
 * Never use wildcard (*) in production
 */

import { CONFIG } from '@/lib/config';

/**
 * Get CORS headers for response
 */
export function getCORSHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = CONFIG.security.allowedOrigins;

  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (isAllowed) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  // Development fallback
  if (CONFIG.debug) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }

  // No CORS headers if origin not allowed
  return {};
}

/**
 * Handle CORS preflight
 */
export function handleCORSPreflight(request: Request): Response {
  const origin = request.headers.get('Origin');
  const headers = getCORSHeaders(origin);

  return new Response(null, {
    status: 204,
    headers,
  });
}
