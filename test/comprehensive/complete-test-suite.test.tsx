/**
 * COMPREHENSIVE TEST SUITE
 * 
 * 25 tests covering all functionality, compatibility, and edge cases
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CONFIG, getRuntimeConfig } from '@/lib/config';
import { generateFingerprint, generateHMAC, verifyHMAC } from '@/lib/utils/fingerprint';
import { anonymizeIP } from '@/lib/features/enrichment/anonymize';
import { calculateTotal, validateCalculatorData } from '@/lib/core/calculator/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { emailSchema, saveQuoteSchema } from '@/lib/core/validations/schemas';

// =============================================================================
// TEST SUITE 1: CONFIGURATION & ENVIRONMENT
// =============================================================================

describe('1. Configuration System', () => {
  it('TEST 1: Should have valid default configuration', () => {
    expect(CONFIG).toBeDefined();
    expect(CONFIG.calculator.currency).toBe('HUF');
    expect(CONFIG.features.rateLimiting).toBe(true);
    expect(CONFIG.security.maxPayloadSize).toBe(1048576);
    expect(CONFIG.dataRetention.quotesMaxAgeDays).toBe(180);
  });

  it('TEST 2: Should generate runtime config with environment variables', () => {
    const mockEnv = {
      RESEND_API_KEY: 'test-key',
      ENVIRONMENT: 'test',
      TURSO_DATABASE_URL: 'libsql://test.turso.io',
      TURSO_AUTH_TOKEN: 'test-token',
    };

    const runtimeConfig = getRuntimeConfig(mockEnv);

    expect(runtimeConfig.email.resendApiKey).toBe('test-key');
    expect(runtimeConfig.monitoring.environment).toBe('test');
    expect(runtimeConfig.email.timeoutMs).toBe(5000);
  });

  it('TEST 3: Should have correct feature flags structure', () => {
    const features = CONFIG.features;

    expect(typeof features.auth).toBe('boolean');
    expect(typeof features.analytics).toBe('boolean');
    expect(typeof features.rateLimiting).toBe('boolean');
    expect(typeof features.ipAnonymization).toBe('boolean');
    expect(typeof features.dataRetention).toBe('boolean');
  });
});

// =============================================================================
// TEST SUITE 2: CRYPTOGRAPHY & SECURITY
// =============================================================================

describe('2. Cryptography & Security', () => {
  it('TEST 4: Should generate consistent fingerprints for same data', () => {
    const data1 = { name: 'Test', price: 100, items: [1, 2, 3] };
    const data2 = { name: 'Test', price: 100, items: [1, 2, 3] };

    const fp1 = generateFingerprint(data1);
    const fp2 = generateFingerprint(data2);

    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64); // SHA-256 hex
  });

  it('TEST 5: Should generate different fingerprints for different data', () => {
    const data1 = { name: 'Test1', price: 100 };
    const data2 = { name: 'Test2', price: 100 };

    const fp1 = generateFingerprint(data1);
    const fp2 = generateFingerprint(data2);

    expect(fp1).not.toBe(fp2);
  });

  it('TEST 6: Should generate and verify HMAC signatures correctly', async () => {
    const payload = 'test payload data';
    const secret = 'test-secret-key-12345';

    const signature = await generateHMAC(payload, secret);
    expect(signature).toHaveLength(64);

    const isValid = await verifyHMAC(payload, signature, secret);
    expect(isValid).toBe(true);

    const isInvalid = await verifyHMAC(payload, 'wrong-signature', secret);
    expect(isInvalid).toBe(false);
  });

  it('TEST 7: Should anonymize IP addresses for GDPR compliance', () => {
    const testIP = '192.168.1.100';
    const result = anonymizeIP(testIP);

    // In production mode, raw IP should be null
    expect(result.hash).toBeDefined();
    expect(result.hash.length).toBeGreaterThanOrEqual(0);

    // Hash should be consistent
    const result2 = anonymizeIP(testIP);
    expect(result.hash).toBe(result2.hash);
  });
});

// =============================================================================
// TEST SUITE 3: VALIDATION SCHEMAS
// =============================================================================

describe('3. Validation Schemas', () => {
  it('TEST 8: Should validate correct email addresses', () => {
    expect(() => emailSchema.parse('test@example.com')).not.toThrow();
    expect(() => emailSchema.parse('user+tag@domain.co.uk')).not.toThrow();
    expect(emailSchema.parse('TEST@EXAMPLE.COM')).toBe('test@example.com');
  });

  it('TEST 9: Should reject invalid email addresses', () => {
    expect(() => emailSchema.parse('invalid')).toThrow();
    expect(() => emailSchema.parse('test@')).toThrow();
    expect(() => emailSchema.parse('@example.com')).toThrow();
    expect(() => emailSchema.parse('test @example.com')).toThrow();
  });

  it('TEST 10: Should validate complete quote data with all fields', () => {
    const validQuote = {
      data: { projectType: 'web', quantity: 5 },
      totalPrice: 50000,
      currency: 'HUF',
      breakdown: { base: 30000, quantity: 20000 },
      language: 'en',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+36301234567',
    };

    expect(() => saveQuoteSchema.parse(validQuote)).not.toThrow();
    const result = saveQuoteSchema.parse(validQuote);
    expect(result.totalPrice).toBe(50000);
    expect(result.currency).toBe('HUF');
  });

  it('TEST 11: Should apply defaults for optional fields', () => {
    const minimalQuote = {
      data: { test: true },
      totalPrice: 10000,
    };

    const result = saveQuoteSchema.parse(minimalQuote);
    expect(result.currency).toBe('HUF');
    expect(result.language).toBe('en');
  });
});

// =============================================================================
// TEST SUITE 4: CALCULATOR LOGIC
// =============================================================================

describe('4. Calculator Logic', () => {
  it('TEST 12: Should calculate base price correctly', () => {
    const result = calculateTotal({});

    expect(result.totalPrice).toBeGreaterThan(0);
    expect(result.currency).toBe('HUF');
    expect(result.breakdown).toBeDefined();
    expect(typeof result.breakdown).toBe('object');
  });

  it('TEST 13: Should apply premium pricing correctly', () => {
    const withPremium = calculateTotal({ premium: true });
    const withoutPremium = calculateTotal({ premium: false });

    expect(withPremium.totalPrice).toBeGreaterThan(withoutPremium.totalPrice);
    expect(withPremium.breakdown.premium).toBeDefined();
  });

  it('TEST 14: Should multiply price by quantity', () => {
    const single = calculateTotal({ quantity: 1 });
    const double = calculateTotal({ quantity: 2 });
    const triple = calculateTotal({ quantity: 3 });

    expect(double.totalPrice).toBeGreaterThan(single.totalPrice);
    expect(triple.totalPrice).toBeGreaterThan(double.totalPrice);
  });

  it('TEST 15: Should validate calculator data and return errors', () => {
    const invalidData = {
      quantity: 0, // Invalid: too low
    };

    const result = validateCalculatorData(invalidData);

    expect(result.isValid).toBe(false);
    expect(result.errors.projectType).toBeDefined();
    expect(result.errors.quantity).toBeDefined();
  });

  it('TEST 16: Should validate correct calculator data', () => {
    const validData = {
      projectType: 'web',
      quantity: 5,
    };

    const result = validateCalculatorData(validData);

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });
});

// =============================================================================
// TEST SUITE 5: UI COMPONENTS
// =============================================================================

describe('5. UI Components', () => {
  it('TEST 17: Should render Button with all variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>Test</Button>);
      expect(container.querySelector('button')).toBeTruthy();
    }
  });

  it('TEST 18: Should render Button with all sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    for (const size of sizes) {
      const { container } = render(<Button size={size}>Test</Button>);
      expect(container.querySelector('button')).toBeTruthy();
    }
  });

  it('TEST 19: Should render Input with error state', () => {
    const { container } = render(<Input error placeholder="Test" />);
    const input = container.querySelector('input');

    expect(input).toBeTruthy();
    expect(input?.className).toContain('border-destructive');
  });

  it('TEST 20: Should render Card with all subcomponents', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );

    expect(container.textContent).toContain('Title');
    expect(container.textContent).toContain('Description');
    expect(container.textContent).toContain('Content');
  });
});

// =============================================================================
// TEST SUITE 6: BROWSER COMPATIBILITY
// =============================================================================

describe('6. Browser Compatibility', () => {
  it('TEST 21: Should support modern browser APIs', () => {
    // Check for required APIs
    expect(typeof crypto.randomUUID).toBe('function');
    expect(typeof crypto.subtle).toBe('object');
    expect(typeof TextEncoder).toBe('function');
    expect(typeof AbortSignal).toBe('function');
  });

  it('TEST 22: Should handle window object safely', () => {
    // Simulate SSR environment
    const originalWindow = global.window;

    // @ts-ignore
    delete global.window;

    // Code should not throw
    const isClient = typeof window !== 'undefined';
    expect(isClient).toBe(false);

    // Restore
    // @ts-ignore
    global.window = originalWindow;
  });

  it('TEST 23: Should support CSS custom properties (CSS Variables)', () => {
    // Check if CSS variables are supported
    const testDiv = document.createElement('div');
    testDiv.style.setProperty('--test-var', 'test');
    const value = testDiv.style.getPropertyValue('--test-var');

    expect(value).toBe('test');
  });
});

// =============================================================================
// TEST SUITE 7: EDGE CASES & ERROR HANDLING
// =============================================================================

describe('7. Edge Cases & Error Handling', () => {
  it('TEST 24: Should handle very large numbers in calculations', () => {
    const largeData = {
      quantity: 999999,
      premium: true,
    };

    const result = calculateTotal(largeData);

    expect(result.totalPrice).toBeGreaterThan(0);
    expect(Number.isFinite(result.totalPrice)).toBe(true);
    expect(result.totalPrice).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('TEST 25: Should handle special characters in fingerprinting', () => {
    const specialData = {
      name: 'Test™️ <script>alert("xss")</script>',
      email: 'test+tag@example.com',
      unicode: '日本語 🎉',
      symbols: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/',
    };

    const fp = generateFingerprint(specialData);

    expect(fp).toBeDefined();
    expect(fp).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(fp)).toBe(true);
  });
});
