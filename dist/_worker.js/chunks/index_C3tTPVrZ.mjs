globalThis.process ??= {}; globalThis.process.env ??= {};
import { C as CONFIG, l as logger } from './logger_AxPQEXXw.mjs';
import { s as sha256, b as bytesToHex } from './sha2_D3U_rMn9.mjs';

function anonymizeIP(ip) {
  if (!CONFIG.features.ipAnonymization) {
    return { raw: ip, hash: "" };
  }
  const hash = sha256(new TextEncoder().encode(ip));
  const hashHex = bytesToHex(hash);
  logger.debug("Enrichment", "IP anonymized", {
    ipPrefix: ip.substring(0, 7)
    // Log first 7 chars for debug
  });
  return {
    raw: CONFIG.features.ipLogging ? ip : null,
    // Only if explicitly enabled
    hash: hashHex
  };
}
function getIPFromRequest(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

let _initialized = false;
async function initEnrichment() {
  if (!CONFIG.features.ipEnrichment || _initialized) return;
  logger.info("Enrichment", "Initializing...");
  try {
    _initialized = true;
    logger.info("Enrichment", "✓ Initialized");
  } catch (error) {
    logger.error("Enrichment", "Initialization failed", { error });
  }
}
function getDeviceInfo(userAgent) {
  if (!userAgent) {
    return { type: "unknown", os: null, browser: null };
  }
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
  const isTablet = /Tablet|iPad/i.test(userAgent);
  let type = "desktop";
  if (isMobile) type = "mobile";
  else if (isTablet) type = "tablet";
  let os = null;
  if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Mac OS X/i.test(userAgent)) os = "macOS";
  else if (/Linux/i.test(userAgent)) os = "Linux";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/iOS|iPhone|iPad/i.test(userAgent)) os = "iOS";
  let browser = null;
  if (/Chrome/i.test(userAgent)) browser = "Chrome";
  else if (/Safari/i.test(userAgent)) browser = "Safari";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";
  else if (/Edge/i.test(userAgent)) browser = "Edge";
  return { type, os, browser };
}

export { anonymizeIP, getDeviceInfo, getIPFromRequest, initEnrichment };
