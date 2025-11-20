/**
 * BOOT ORCHESTRATOR
 * 
 * Initializes all features based on feature flags
 * Called once at application startup
 */

import { CONFIG } from './config';
import { logger } from './utils/logger';

let _booted = false;
let _bootError: Error | null = null;

/**
 * Boot application
 * Initializes enabled features
 */
export async function bootApp(_env?: any): Promise<void> {
  if (_booted) {
    logger.debug('Boot', 'Already booted, skipping');
    return;
  }

  if (_bootError) {
    logger.error('Boot', 'Previous boot failed, not retrying', { error: _bootError });
    throw _bootError;
  }

  logger.info('Boot', 'Starting application boot...');

  try {
    const startTime = Date.now();

    // 1. Initialize security (always enabled)
    logger.debug('Boot', 'Initializing security...');
    const { initSecurity } = await import('./features/security');
    await initSecurity();

    // 2. Initialize enrichment if enabled
    if (CONFIG.features.ipEnrichment) {
      logger.debug('Boot', 'Initializing enrichment...');
      const { initEnrichment } = await import('./features/enrichment');
      await initEnrichment();
    }

    // 3. Initialize analytics if enabled
    if (CONFIG.features.analytics) {
      logger.debug('Boot', 'Initializing analytics...');
      const { initAnalytics } = await import('./features/analytics');
      await initAnalytics(_env);
    }

    // 4. Initialize auth if enabled
    if (CONFIG.features.auth) {
      logger.debug('Boot', 'Initializing auth...');
      // Auth will be initialized on-demand
      logger.info('Boot', 'Auth configured (on-demand initialization)');
    }

    // 5. Initialize monitoring if enabled
    if (CONFIG.features.sentry) {
      logger.debug('Boot', 'Initializing monitoring...');
      // Sentry is initialized per-request in middleware
      logger.info('Boot', 'Monitoring configured (per-request initialization)');
    }

    const bootTime = Date.now() - startTime;
    _booted = true;

    logger.info('Boot', `✓ Application boot complete (${bootTime}ms)`, {
      features: {
        security: true,
        enrichment: CONFIG.features.ipEnrichment,
        analytics: CONFIG.features.analytics,
        auth: CONFIG.features.auth,
        monitoring: CONFIG.features.sentry,
      },
    });
  } catch (error) {
    _bootError = error instanceof Error ? error : new Error(String(error));
    logger.error('Boot', 'Boot failed', { error: _bootError });
    throw _bootError;
  }
}

/**
 * Check if application is booted
 */
export function isBooted(): boolean {
  return _booted;
}

/**
 * Get boot error (if any)
 */
export function getBootError(): Error | null {
  return _bootError;
}
