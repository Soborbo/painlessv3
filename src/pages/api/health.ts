/**
 * HEALTH CHECK ENDPOINT
 *
 * Returns service status
 * Used by monitoring tools, load balancers
 */

import { CONFIG } from '@/lib/config';
import { logger } from '@/lib/utils/logger';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const runtime = context.locals.runtime as any;

  logger.debug('API', 'Health check requested');

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: runtime?.env?.ENVIRONMENT || 'unknown',
    features: {
      analytics: CONFIG.features.analytics,
      auth: CONFIG.features.auth,
      crmSync: CONFIG.features.crmSync,
      rateLimiting: CONFIG.features.rateLimiting,
      monitoring: CONFIG.features.sentry,
    },
    checks: {
      database: !!runtime?.env?.TURSO_DATABASE_URL,
      email: !!runtime?.env?.RESEND_API_KEY,
      kv: !!runtime?.env?.RATE_LIMITER,
    },
  };

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
};
