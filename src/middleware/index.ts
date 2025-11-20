/**
 * GLOBAL MIDDLEWARE
 * 
 * Handles:
 * - Boot application
 * - Sentry initialization
 * - Dynamic URL detection
 * - Security headers
 * - Global error handling
 */

import { defineMiddleware } from 'astro:middleware';
import { bootApp } from '@/lib/boot';
import { initSentry, captureException } from '@/lib/features/monitoring/toucan';
import { CONFIG } from '@/lib/config';
import { logger } from '@/lib/utils/logger';

// Track if boot already ran
let _booted = false;

/**
 * Global middleware
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, url } = context;
  const runtime = locals.runtime as any;

  // Dynamic site URL is available via url.origin
  // Note: CONFIG.site.url is read-only, use url.origin in runtime

  // Boot app once (first request)
  if (!_booted && runtime?.env) {
    try {
      await bootApp(runtime.env);
      _booted = true;
      logger.info('Middleware', 'Application booted successfully');
    } catch (error) {
      logger.error('Middleware', 'Boot failed', { error });
    }
  }

  // Initialize Sentry for this request
  if (CONFIG.features.sentry && runtime?.env) {
    try {
      const sentry = initSentry(request, runtime.env, context);
      if (sentry) {
        locals.sentry = sentry;
      }
    } catch (error) {
      logger.error('Middleware', 'Sentry init failed', { error });
    }
  }

  let response: Response;

  try {
    // Continue to route handler
    response = await next();
  } catch (error) {
    // Catch unhandled errors
    logger.error('Middleware', 'Unhandled route error', { error });

    if (locals.sentry && error instanceof Error) {
      captureException(error, { url: url.pathname });
    }

    // Return 500 error page
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Security headers
  const headers = new Headers(response.headers);

  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Cache control for API routes
  if (url.pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'private, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
