globalThis.process ??= {}; globalThis.process.env ??= {};
import { l as logger } from './logger_AxPQEXXw.mjs';
export { c as checkRateLimit, a as createRateLimitResponse } from './rate-limit_CAI_5mdE.mjs';
export { c as checkPayloadSize, a as createPayloadTooLargeResponse } from './payload-limit_DXE4oF9B.mjs';

let _initialized = false;
async function initSecurity() {
  if (_initialized) return;
  logger.info("Security", "Initializing...");
  try {
    _initialized = true;
    logger.info("Security", "✓ Initialized");
  } catch (error) {
    logger.error("Security", "Initialization failed", { error });
  }
}

export { initSecurity };
