globalThis.process ??= {}; globalThis.process.env ??= {};
import { C as CONFIG } from './logger_AxPQEXXw.mjs';

function getCORSHeaders(origin) {
  const allowedOrigins = CONFIG.security.allowedOrigins;
  const isAllowed = origin && allowedOrigins.includes(origin);
  if (isAllowed) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true"
    };
  }
  return {};
}

function generateErrorId() {
  return crypto.randomUUID().substring(0, 8);
}
function formatError(error, errorId) {
  if (error instanceof Error) {
    return {
      errorId,
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return {
    errorId,
    error: String(error)
  };
}
function createErrorResponse(message, errorId, status = 500) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      errorId
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Error-ID": errorId
      }
    }
  );
}

export { getCORSHeaders as a, createErrorResponse as c, formatError as f, generateErrorId as g };
