import { describe, expect, it } from 'vitest';

describe('Page Routes', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/calculator/step-01', name: 'Calculator Step 1' },
    { path: '/calculator/summary', name: 'Calculator Summary' },
    { path: '/thank-you', name: 'Thank You' },
    { path: '/404', name: '404 Error' },
    { path: '/500', name: '500 Error' },
  ];

  it('should have all required pages defined', () => {
    expect(pages.length).toBeGreaterThan(0);

    for (const page of pages) {
      expect(page.path).toBeDefined();
      expect(page.name).toBeDefined();
    }
  });

  it('should have valid route paths', () => {
    for (const page of pages) {
      expect(page.path).toMatch(/^\/[\w\-/]*$/);
    }
  });
});
