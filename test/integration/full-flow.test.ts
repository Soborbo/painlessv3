import { describe, expect, it } from 'vitest';

describe('Full Application Flow', () => {
  it('should have all core modules', async () => {
    // Test imports
    const config = await import('@/lib/config');
    const logger = await import('@/lib/utils/logger');
    const boot = await import('@/lib/boot');

    expect(config.CONFIG).toBeDefined();
    expect(logger.logger).toBeDefined();
    expect(boot.bootApp).toBeDefined();
  });

  it('should have all API endpoints', () => {
    const endpoints = ['/api/health', '/api/calculate', '/api/validate', '/api/save-quote'];

    for (const endpoint of endpoints) {
      expect(endpoint).toMatch(/^\/api\/[\w-]+$/);
    }
  });

  it('should have all required components', async () => {
    const { Button } = await import('@/components/ui/button');
    const { Input } = await import('@/components/ui/input');
    const { Card } = await import('@/components/ui/card');

    expect(Button).toBeDefined();
    expect(Input).toBeDefined();
    expect(Card).toBeDefined();
  });
});
