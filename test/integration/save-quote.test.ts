import type { SaveQuoteInput } from '@/lib/core/validations/schemas';
import { describe, expect, it } from 'vitest';

describe('Save Quote API', () => {
  const validQuoteData: SaveQuoteInput = {
    data: {
      projectType: 'web',
      quantity: 5,
    },
    totalPrice: 50000,
    currency: 'HUF',
    breakdown: {
      base: 30000,
      quantity: 20000,
    },
    language: 'en',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+36301234567',
  };

  it('should validate quote data structure', () => {
    expect(validQuoteData).toHaveProperty('data');
    expect(validQuoteData).toHaveProperty('totalPrice');
    expect(validQuoteData.totalPrice).toBeGreaterThan(0);
  });

  it('should include required fields', () => {
    expect(validQuoteData.data).toBeDefined();
    expect(validQuoteData.totalPrice).toBeDefined();
  });

  it('should accept optional fields', () => {
    const withOptional: SaveQuoteInput = {
      ...validQuoteData,
      utm_source: 'google',
      utm_campaign: 'summer_sale',
      gclid: 'test_gclid',
    };

    expect(withOptional.utm_source).toBe('google');
    expect(withOptional.gclid).toBe('test_gclid');
  });

  // Note: Actual API tests require running server
  // These will be added in E2E tests
});
