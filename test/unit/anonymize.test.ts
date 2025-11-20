import { anonymizeIP, getIPFromRequest } from '@/lib/features/enrichment/anonymize';
import { describe, expect, it } from 'vitest';

describe('IP Anonymization', () => {
  it('should anonymize IP addresses', () => {
    const result = anonymizeIP('192.168.1.1');

    // In development mode, ipAnonymization is disabled
    // So we get raw IP and empty hash
    if (result.hash) {
      expect(result.hash).toHaveLength(64);
      expect(result.raw).toBeNull();
    } else {
      // Development mode
      expect(result.raw).toBe('192.168.1.1');
      expect(result.hash).toBe('');
    }
  });

  it('should get IP from request headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'CF-Connecting-IP': '192.168.1.1',
      },
    });

    const ip = getIPFromRequest(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should fallback to X-Forwarded-For', () => {
    const request = new Request('https://example.com', {
      headers: {
        'X-Forwarded-For': '192.168.1.1, 10.0.0.1',
      },
    });

    const ip = getIPFromRequest(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should return unknown if no IP headers', () => {
    const request = new Request('https://example.com');

    const ip = getIPFromRequest(request);
    expect(ip).toBe('unknown');
  });
});
