/**
 * BOOT ORCHESTRATOR
 *
 * Initializes all features based on feature flags
 * Called once at application startup
 */

import { CONFIG } from './config';
import { logger } from './utils/logger';

let _booted = false;

/**
 * Boot application
 * Initializes enabled features
 */
export async function bootApp(_env?: any): Promise<void> {
  if (_booted) {
    logger.debug('Boot', 'Already booted, skipping');
    return;
  }

  logger.info('Boot', 'Starting application boot...');

  try {
    // Initialize security (always enabled)
    const { initSecurity } = await import('./features/security');
    await initSecurity();

    // Initialize enrichment if enabled
    if (CONFIG.features.ipEnrichment) {
      const { initEnrichment } = await import('./features/enrichment');
      await initEnrichment();
    }

    // TODO: More features will be initialized here

    _booted = true;
    logger.info('Boot', '✓ Application boot complete');
  } catch (error) {
    logger.error('Boot', 'Boot failed', { error });
    throw error;
  }
}

/**
 * Check if application is booted
 */
export function isBooted(): boolean {
  return _booted;
}
