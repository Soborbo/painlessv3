import {
  calculateTotal,
  formatCalculatedPrice,
  getPriceItems,
  validateCalculatorData,
} from '@/lib/core/calculator/calculations';
import { describe, expect, it } from 'vitest';

describe('Calculator Logic', () => {
  describe('calculateTotal', () => {
    it('should calculate base price', () => {
      const result = calculateTotal({});

      expect(result.totalPrice).toBeGreaterThan(0);
      expect(result.currency).toBe('HUF');
      expect(result.breakdown).toBeDefined();
    });

    it('should add premium price', () => {
      const withPremium = calculateTotal({ premium: true });
      const withoutPremium = calculateTotal({ premium: false });

      expect(withPremium.totalPrice).toBeGreaterThan(withoutPremium.totalPrice);
    });

    it('should multiply by quantity', () => {
      const single = calculateTotal({ quantity: 1 });
      const double = calculateTotal({ quantity: 2 });

      expect(double.totalPrice).toBe(single.totalPrice * 2);
    });

    it('should apply discount', () => {
      const withDiscount = calculateTotal({ discountCode: 'SAVE10' });
      const withoutDiscount = calculateTotal({});

      expect(withDiscount.totalPrice).toBeLessThan(withoutDiscount.totalPrice);
    });
  });

  describe('validateCalculatorData', () => {
    it('should validate correct data', () => {
      const result = validateCalculatorData({
        projectType: 'web',
        quantity: 5,
      });

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should detect missing fields', () => {
      const result = validateCalculatorData({});

      expect(result.isValid).toBe(false);
      expect(result.errors.projectType).toBeDefined();
    });

    it('should validate quantity range', () => {
      const tooLow = validateCalculatorData({ quantity: 0 });
      const tooHigh = validateCalculatorData({ quantity: 101 });

      expect(tooLow.isValid).toBe(false);
      expect(tooHigh.isValid).toBe(false);
    });
  });

  describe('formatCalculatedPrice', () => {
    it('should format price correctly', () => {
      const result = {
        totalPrice: 10000,
        currency: 'HUF',
        breakdown: {},
      };

      const formatted = formatCalculatedPrice(result);
      expect(formatted).toContain('10');
      expect(formatted).toContain('000');
    });
  });

  describe('getPriceItems', () => {
    it('should extract price items', () => {
      const result = {
        totalPrice: 15000,
        currency: 'HUF',
        breakdown: {
          base: 10000,
          premium: 5000,
        },
      };

      const items = getPriceItems(result);
      expect(items).toHaveLength(2);
      expect(items[0].amount).toBe(10000);
    });
  });
});
