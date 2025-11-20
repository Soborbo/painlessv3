/**
 * FINGERPRINT GENERATION
 * 
 * Generate unique hashes for duplicate prevention
 * Uses @noble/hashes (Edge-compatible)
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

/**
 * Generate SHA-256 hash from data
 * Used for duplicate detection
 */
export function generateFingerprint(data: unknown): string {
  // Sort keys for consistent hashing
  const json = JSON.stringify(data, Object.keys(data as object).sort());
  const hash = sha256(new TextEncoder().encode(json));
  return bytesToHex(hash);
}

/**
 * Generate rate limit key hash
 * Combines IP + UserAgent for better granularity
 */
export function generateRateLimitKey(ip: string, userAgent?: string): string {
  const combined = `${ip}:${userAgent || 'unknown'}`;
  const hash = sha256(new TextEncoder().encode(combined));
  return bytesToHex(hash).substring(0, 16); // First 16 chars
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(randomBytes);
}

/**
 * Hash sensitive data (one-way)
 * Use for storing passwords, tokens, etc.
 */
export function hashSensitiveData(data: string): string {
  const hash = sha256(new TextEncoder().encode(data));
  return bytesToHex(hash);
}
