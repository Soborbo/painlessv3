import type { Quote } from '@/lib/core/db/schema';
import {
  generateAdminNotificationEmail,
  generateQuoteConfirmationEmail,
} from '@/lib/core/email/templates';
import { describe, expect, it } from 'vitest';

describe('Email Templates', () => {
  const mockQuote: Partial<Quote> = {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+36301234567',
    totalPrice: 50000,
    currency: 'HUF',
    breakdown: {
      base: 30000,
      premium: 20000,
    },
    language: 'en',
    calculatorData: { test: true },
    createdAt: new Date(),
  };

  it('should generate quote confirmation email', () => {
    const html = generateQuoteConfirmationEmail(mockQuote as Quote, 'https://example.com');

    expect(html).toContain('John Doe');
    expect(html).toContain('50');
    expect(html).toContain('000');
    expect(html).toContain('Quote ID: #123');
  });

  it('should generate admin notification email', () => {
    const html = generateAdminNotificationEmail(mockQuote as Quote, 'https://example.com');

    expect(html).toContain('New Quote Request #123');
    expect(html).toContain('john@example.com');
    expect(html).toContain('+36301234567');
  });

  it('should handle missing optional fields', () => {
    const minimalQuote: Partial<Quote> = {
      id: 456,
      totalPrice: 10000,
      currency: 'HUF',
      calculatorData: {},
      createdAt: new Date(),
    };

    const html = generateQuoteConfirmationEmail(minimalQuote as Quote, 'https://example.com');

    expect(html).toContain('there'); // Default greeting
    expect(html).toContain('Quote ID: #456');
  });
});
