globalThis.process ??= {}; globalThis.process.env ??= {};
import { C as CONFIG, l as logger } from './logger_AxPQEXXw.mjs';

let _initialized = false;
async function initAnalytics(_env) {
  if (!CONFIG.features.analytics || _initialized) return;
  logger.info("Analytics", "Initializing...");
  try {
    _initialized = true;
    logger.info("Analytics", "✓ Initialized");
  } catch (error) {
    logger.error("Analytics", "Initialization failed", { error });
  }
}

export { initAnalytics };
