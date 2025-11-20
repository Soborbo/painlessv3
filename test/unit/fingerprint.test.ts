import { describe, it, expect } from 'vitest';
import {
  generateFingerprint,
  generateRateLimitKey,
  generateSessionId,
  hashSensitiveData,
} from '@/lib/utils/fingerprint';

describe('Fingerprint Utils', () => {
  it('should generate consistent fingerprints for same data', () => {
    const data = { email: 'test@example.com', phone: '123456789' };
    const hash1 = generateFingerprint(data);
    const hash2 = generateFingerprint(data);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
  });

  it('should generate different fingerprints for different data', () => {
    const data1 = { email: 'test1@example.com' };
    const data2 = { email: 'test2@example.com' };
    
    const hash1 = generateFingerprint(data1);
    const hash2 = generateFingerprint(data2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should generate rate limit keys', () => {
    const key1 = generateRateLimitKey('192.168.1.1', 'Mozilla/5.0');
    const key2 = generateRateLimitKey('192.168.1.1', 'Mozilla/5.0');
    
    expect(key1).toBe(key2);
    expect(key1).toHaveLength(16); // Truncated to 16 chars
  });

  it('should generate unique session IDs', () => {
    const session1 = generateSessionId();
    const session2 = generateSessionId();
    
    expect(session1).not.toBe(session2);
    expect(session1).toHaveLength(64); // 32 bytes = 64 hex chars
  });

  it('should hash sensitive data consistently', () => {
    const hash1 = hashSensitiveData('my-secret-password');
    const hash2 = hashSensitiveData('my-secret-password');
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should produce different hashes for different sensitive data', () => {
    const hash1 = hashSensitiveData('password1');
    const hash2 = hashSensitiveData('password2');
    
    expect(hash1).not.toBe(hash2);
  });
});
