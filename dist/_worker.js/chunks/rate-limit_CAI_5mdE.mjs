globalThis.process ??= {}; globalThis.process.env ??= {};
import { l as logger, C as CONFIG } from './logger_AxPQEXXw.mjs';
import { s as sha256, b as bytesToHex } from './sha2_D3U_rMn9.mjs';

function generateFingerprint(data) {
  const json = JSON.stringify(data, Object.keys(data).sort());
  const hash = sha256(new TextEncoder().encode(json));
  return bytesToHex(hash);
}
function generateRateLimitKey(ip, userAgent) {
  const combined = `${ip}:${userAgent || "unknown"}`;
  const hash = sha256(new TextEncoder().encode(combined));
  return bytesToHex(hash).substring(0, 16);
}

function safeKV(env, namespace) {
  if (!env || !env[namespace]) {
    logger.warn("KV", `Namespace "${namespace}" not available`);
    return null;
  }
  return env[namespace];
}
async function kvGet(kv, key, fallback) {
  if (!kv) return fallback ?? null;
  try {
    const value = await kv.get(key);
    return value !== null ? value : fallback ?? null;
  } catch (error) {
    logger.error("KV", `Failed to get key "${key}"`, { error });
    return fallback ?? null;
  }
}
async function kvPut(kv, key, value, options) {
  if (!kv) return false;
  try {
    await kv.put(key, value, options);
    return true;
  } catch (error) {
    logger.error("KV", `Failed to put key "${key}"`, { error });
    return false;
  }
}

async function checkRateLimit(context) {
  if (!CONFIG.features.rateLimiting) {
    return true;
  }
  const { locals, request } = context;
  const runtime = locals.runtime;
  const kv = safeKV(runtime?.env, "RATE_LIMITER");
  if (!kv) {
    logger.warn("RateLimit", "KV not configured, allowing request");
    return true;
  }
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0] || "unknown";
  if (ip === "unknown") {
    logger.warn("RateLimit", "Could not determine IP");
    return true;
  }
  const userAgent = request.headers.get("User-Agent") || void 0;
  const keyHash = generateRateLimitKey(ip, userAgent);
  const env = "prod";
  const key = `rate_limit:${env}:${keyHash}`;
  try {
    const current = await kvGet(kv, key);
    if (!current) {
      await kvPut(kv, key, "1", {
        expirationTtl: Math.floor(CONFIG.security.rateLimitWindowMs / 1e3)
      });
      return true;
    }
    const count = Number.parseInt(current, 10);
    if (Number.isNaN(count)) {
      logger.warn("RateLimit", "Invalid counter, resetting", { key });
      await kvPut(kv, key, "1", {
        expirationTtl: Math.floor(CONFIG.security.rateLimitWindowMs / 1e3)
      });
      return true;
    }
    if (count >= CONFIG.security.rateLimitRequests) {
      logger.warn("RateLimit", "Limit exceeded", {
        ip,
        count,
        limit: CONFIG.security.rateLimitRequests
      });
      return false;
    }
    await kvPut(kv, key, String(count + 1), {
      expirationTtl: Math.floor(CONFIG.security.rateLimitWindowMs / 1e3)
    });
    return true;
  } catch (error) {
    logger.error("RateLimit", "Check failed", { error });
    return true;
  }
}
function createRateLimitResponse(errorId) {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Rate limit exceeded. Please try again later.",
      errorId
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(CONFIG.security.rateLimitWindowMs / 1e3)
      }
    }
  );
}

export { createRateLimitResponse as a, checkRateLimit as c, generateFingerprint as g };
