import {
  calculateSchema,
  emailSchema,
  nameSchema,
  phoneSchema,
  saveQuoteSchema,
} from '@/lib/core/validations/schemas';
import { describe, expect, it } from 'vitest';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct emails', () => {
      expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
      expect(emailSchema.parse('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('should reject invalid emails', () => {
      expect(() => emailSchema.parse('invalid')).toThrow();
      expect(() => emailSchema.parse('test@')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
    });
  });

  describe('phoneSchema', () => {
    it('should validate correct phone numbers', () => {
      expect(phoneSchema.parse('+36301234567')).toBe('+36301234567');
      expect(phoneSchema.parse('06-30-123-4567')).toBe('06-30-123-4567');
    });

    it('should reject invalid phone numbers', () => {
      expect(() => phoneSchema.parse('123')).toThrow(); // too short
      expect(() => phoneSchema.parse('abc')).toThrow(); // letters
    });
  });

  describe('nameSchema', () => {
    it('should validate correct names', () => {
      expect(nameSchema.parse('John Doe')).toBe('John Doe');
      expect(nameSchema.parse('  Alice  ')).toBe('Alice');
    });

    it('should reject invalid names', () => {
      expect(() => nameSchema.parse('A')).toThrow(); // too short
      expect(() => nameSchema.parse('')).toThrow(); // empty
    });
  });

  describe('saveQuoteSchema', () => {
    it('should validate correct quote data', () => {
      const valid = {
        data: { test: true },
        totalPrice: 10000,
        currency: 'HUF',
        language: 'en',
      };

      const result = saveQuoteSchema.parse(valid);
      expect(result.totalPrice).toBe(10000);
      expect(result.currency).toBe('HUF');
    });

    it('should reject invalid quote data', () => {
      expect(() =>
        saveQuoteSchema.parse({
          data: {},
          totalPrice: -100, // negative
        })
      ).toThrow();
    });

    it('should use defaults', () => {
      const minimal = {
        data: { test: true },
        totalPrice: 5000,
      };

      const result = saveQuoteSchema.parse(minimal);
      expect(result.currency).toBe('HUF');
      expect(result.language).toBe('en');
    });
  });

  describe('calculateSchema', () => {
    it('should validate calculation input', () => {
      const valid = {
        step: 'step-01',
        data: { quantity: 5 },
        language: 'en',
      };

      const result = calculateSchema.parse(valid);
      expect(result.step).toBe('step-01');
      expect(result.data).toEqual({ quantity: 5 });
    });
  });
});
