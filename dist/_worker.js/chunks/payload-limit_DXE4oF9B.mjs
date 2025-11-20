globalThis.process ??= {}; globalThis.process.env ??= {};
import { l as logger, C as CONFIG } from './logger_AxPQEXXw.mjs';

async function checkPayloadSize(context) {
  if (!CONFIG.features.payloadLimit) {
    return true;
  }
  const contentLength = context.request.headers.get("Content-Length");
  if (!contentLength) {
    logger.warn("Security", "Missing Content-Length header");
    return true;
  }
  const size = Number.parseInt(contentLength, 10);
  if (isNaN(size)) {
    logger.warn("Security", "Invalid Content-Length header");
    return true;
  }
  if (size > CONFIG.security.maxPayloadSize) {
    logger.warn("Security", "Payload too large", {
      size,
      limit: CONFIG.security.maxPayloadSize
    });
    return false;
  }
  return true;
}
function createPayloadTooLargeResponse(errorId) {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Payload too large",
      maxSize: CONFIG.security.maxPayloadSize,
      errorId
    }),
    {
      status: 413,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export { createPayloadTooLargeResponse as a, checkPayloadSize as c };
