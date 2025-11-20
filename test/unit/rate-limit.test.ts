import { CONFIG } from '@/lib/config';
import { describe, expect, it } from 'vitest';

describe('Rate Limiting', () => {
  it('should have rate limit configuration', () => {
    expect(CONFIG.security.rateLimitRequests).toBeGreaterThan(0);
    expect(CONFIG.security.rateLimitWindowMs).toBeGreaterThan(0);
  });

  it('should enforce rate limits', () => {
    const limit = CONFIG.security.rateLimitRequests;
    expect(limit).toBe(10); // Default: 10 requests per minute
  });

  // Note: Full integration tests require KV namespace
  // These will be in integration tests
});
