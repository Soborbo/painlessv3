import { CONFIG, getRuntimeConfig } from '@/lib/config';
import { describe, expect, it } from 'vitest';

describe('Configuration', () => {
  it('should have default config values', () => {
    expect(CONFIG.calculator.currency).toBe('HUF');
    expect(CONFIG.features.rateLimiting).toBe(true);
    expect(CONFIG.security.maxPayloadSize).toBe(1048576);
  });

  it('should generate runtime config', () => {
    const mockEnv = {
      RESEND_API_KEY: 'test-key',
      ENVIRONMENT: 'test',
    };

    const runtimeConfig = getRuntimeConfig(mockEnv);

    expect(runtimeConfig.email.resendApiKey).toBe('test-key');
    expect(runtimeConfig.monitoring.environment).toBe('test');
  });

  it('should have correct locale types', () => {
    const locales = CONFIG.languages.available;
    expect(locales).toContain('en');
    expect(locales).toContain('es');
    expect(locales).toContain('fr');
  });
});
