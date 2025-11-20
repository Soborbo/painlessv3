import { cn, formatDate, formatPrice, randomId, safeJsonParse, truncate } from '@/lib/utils';
import { describe, expect, it } from 'vitest';

describe('Utilities', () => {
  it('should merge classnames correctly', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
    expect(result).toContain('bg-blue-500');
  });

  it('should format price correctly', () => {
    const result = formatPrice(10000, 'HUF');
    expect(result).toContain('10');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    const result = formatDate(date);
    expect(result).toContain('2024');
  });

  it('should safely parse JSON', () => {
    const valid = safeJsonParse('{"test": true}', {});
    expect(valid).toEqual({ test: true });

    const invalid = safeJsonParse('invalid', { fallback: true });
    expect(invalid).toEqual({ fallback: true });
  });

  it('should truncate strings', () => {
    const result = truncate('Hello World', 5);
    expect(result).toBe('Hello...');
  });

  it('should generate random IDs', () => {
    const id = randomId(8);
    expect(id).toHaveLength(8);
  });
});
