import {
  generateCSRFToken,
  isBot,
  validateCSRFToken,
  validateOrigin,
} from '@/lib/features/security';
import { describe, expect, it } from 'vitest';

describe('Security Utilities', () => {
  it('should validate allowed origins', () => {
    const valid = validateOrigin('https://your-domain.com');
    const invalid = validateOrigin('https://evil.com');

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it('should detect bots', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
    expect(isBot('curl/7.64.1')).toBe(true);
    expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
  });

  it('should generate CSRF tokens', () => {
    const token1 = generateCSRFToken();
    const token2 = generateCSRFToken();

    expect(token1).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('should validate CSRF tokens', () => {
    const token = generateCSRFToken();

    expect(validateCSRFToken(token, token)).toBe(true);
    expect(validateCSRFToken(token, 'wrong')).toBe(false);
    expect(validateCSRFToken('', token)).toBe(false);
  });
});
