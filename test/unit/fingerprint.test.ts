import {
  generateFingerprint,
  generateHMAC,
  generateRateLimitKey,
  generateSessionId,
  hashSensitiveData,
  verifyHMAC,
} from '@/lib/utils/fingerprint';
import { describe, expect, it } from 'vitest';

describe('Fingerprint Utilities', () => {
  it('should generate consistent fingerprints', () => {
    const data = { name: 'Test', price: 100 };
    const fp1 = generateFingerprint(data);
    const fp2 = generateFingerprint(data);

    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64); // SHA-256 hex
  });

  it('should generate different fingerprints for different data', () => {
    const data1 = { name: 'Test1', price: 100 };
    const data2 = { name: 'Test2', price: 100 };

    const fp1 = generateFingerprint(data1);
    const fp2 = generateFingerprint(data2);

    expect(fp1).not.toBe(fp2);
  });

  it('should generate rate limit keys', () => {
    const key = generateRateLimitKey('192.168.1.1', 'Mozilla/5.0');

    expect(key).toHaveLength(16);
  });

  it('should generate unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();

    expect(id1).not.toBe(id2);
    expect(id1).toHaveLength(64);
  });

  it('should hash sensitive data', () => {
    const hash1 = hashSensitiveData('password123');
    const hash2 = hashSensitiveData('password123');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should generate and verify HMAC signatures', async () => {
    const payload = 'test payload';
    const secret = 'test-secret';

    const signature = await generateHMAC(payload, secret);
    expect(signature).toHaveLength(64);

    const isValid = await verifyHMAC(payload, signature, secret);
    expect(isValid).toBe(true);

    const isInvalid = await verifyHMAC(payload, 'wrong-signature', secret);
    expect(isInvalid).toBe(false);
  });
});
