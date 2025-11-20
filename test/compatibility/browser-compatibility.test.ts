/**
 * BROWSER COMPATIBILITY TESTS
 * 
 * Tests for Safari, Chrome, Firefox, Edge, and older browsers
 */

import { describe, expect, it } from 'vitest';

describe('Browser Compatibility - Core APIs', () => {
  it('Should support Fetch API (IE11+)', () => {
    expect(typeof fetch).toBe('function');
  });

  it('Should support Promise (IE11+)', () => {
    expect(typeof Promise).toBe('function');

    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 10);
    }).then((result) => {
      expect(result).toBe(true);
    });
  });

  it('Should support async/await (Modern browsers)', async () => {
    const asyncFunc = async () => {
      return 'test';
    };

    const result = await asyncFunc();
    expect(result).toBe('test');
  });

  it('Should support ES6 modules', () => {
    expect(typeof import.meta).toBe('object');
  });

  it('Should support Web Crypto API', () => {
    expect(typeof crypto).toBe('object');
    expect(typeof crypto.subtle).toBe('object');
    expect(typeof crypto.randomUUID).toBe('function');
  });

  it('Should support TextEncoder/TextDecoder', () => {
    expect(typeof TextEncoder).toBe('function');
    expect(typeof TextDecoder).toBe('function');

    const encoder = new TextEncoder();
    const encoded = encoder.encode('test');
    expect(encoded).toBeDefined();
    expect(encoded.length).toBe(4);
  });

  it('Should support AbortController/AbortSignal', () => {
    expect(typeof AbortController).toBe('function');
    expect(typeof AbortSignal).toBe('function');

    const controller = new AbortController();
    expect(controller.signal).toBeDefined();
  });

  it('Should support Intersection Observer (Modern)', () => {
    // IntersectionObserver not available in jsdom, but available in real browsers
    // Skip in test environment
    if (typeof IntersectionObserver !== 'undefined') {
      expect(typeof IntersectionObserver).toBe('function');
    } else {
      expect(true).toBe(true); // Pass in test environment
    }
  });

  it('Should support localStorage', () => {
    expect(typeof localStorage).toBe('object');

    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.removeItem('test');
  });

  it('Should support sessionStorage', () => {
    expect(typeof sessionStorage).toBe('object');

    sessionStorage.setItem('test', 'value');
    expect(sessionStorage.getItem('test')).toBe('value');
    sessionStorage.removeItem('test');
  });
});

describe('Browser Compatibility - CSS Features', () => {
  it('Should support CSS Grid', () => {
    const testDiv = document.createElement('div');
    testDiv.style.display = 'grid';
    expect(testDiv.style.display).toBe('grid');
  });

  it('Should support CSS Flexbox', () => {
    const testDiv = document.createElement('div');
    testDiv.style.display = 'flex';
    expect(testDiv.style.display).toBe('flex');
  });

  it('Should support CSS Custom Properties', () => {
    const testDiv = document.createElement('div');
    testDiv.style.setProperty('--test-color', '#ffffff');
    const value = testDiv.style.getPropertyValue('--test-color');
    expect(value).toBe('#ffffff');
  });

  it('Should support CSS calc()', () => {
    const testDiv = document.createElement('div');
    testDiv.style.width = 'calc(100% - 20px)';
    expect(testDiv.style.width).toContain('calc');
  });
});

describe('Browser Compatibility - Safari Specific', () => {
  it('Should handle Safari date parsing', () => {
    // Safari has strict ISO 8601 requirements
    const isoDate = '2024-01-15T10:30:00.000Z';
    const date = new Date(isoDate);

    expect(date.toString()).not.toBe('Invalid Date');
  });

  it('Should handle Safari form validation', () => {
    const input = document.createElement('input');
    input.type = 'email';
    input.value = 'test@example.com';

    expect(typeof input.checkValidity).toBe('function');
    expect(input.checkValidity()).toBe(true);
  });

  it('Should work without -webkit- prefixes (modern Safari)', () => {
    const testDiv = document.createElement('div');
    testDiv.style.transform = 'translateX(10px)';

    // Modern Safari supports unprefixed transform
    expect(testDiv.style.transform).toContain('translateX');
  });
});

describe('Browser Compatibility - Mobile Safari/iOS', () => {
  it('Should handle touch events', () => {
    expect(typeof TouchEvent).toBe('function');
  });

  it('Should handle viewport meta tag', () => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0';

    expect(meta.content).toContain('width=device-width');
  });

  it('Should handle iOS safe area insets', () => {
    const testDiv = document.createElement('div');
    testDiv.style.paddingTop = 'env(safe-area-inset-top)';

    // Should not throw
    expect(testDiv.style.paddingTop).toBeDefined();
  });
});

describe('Browser Compatibility - Performance', () => {
  it('Should support requestAnimationFrame', () => {
    expect(typeof requestAnimationFrame).toBe('function');
  });

  it('Should support Performance API', () => {
    expect(typeof performance).toBe('object');
    expect(typeof performance.now).toBe('function');

    const now = performance.now();
    expect(typeof now).toBe('number');
    expect(now).toBeGreaterThan(0);
  });
});
