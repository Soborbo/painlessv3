/**
 * MASTER CONFIGURATION
 *
 * Feature flags - Everything can be toggled here
 * Core NEVER changes, only this file!
 *
 * IMPORTANT: This file runs at BUILD-TIME (Astro config)
 * For runtime env vars, use getRuntimeConfig() in API routes
 */

// Build-time environment check
const isProduction = import.meta.env.MODE === 'production';
const isDevelopment = import.meta.env.MODE === 'development';

export const CONFIG = {
  // Site info (runtime-derived)
  site: {
    name: 'Calculator Boilerplate',
    // URL is derived at runtime from request.url
    url: undefined as string | undefined,
    defaultLocale: 'en' as const,
  },

  // Calculator settings
  calculator: {
    currency: 'HUF',
    phoneNumber: '+36-XX-XXX-XXXX',
    idleTimeSeconds: 20,
    emailFrom: 'noreply@your-domain.com',
    emailSupport: 'support@your-domain.com',
    schemaVersion: 1,
  },

  // FEATURE FLAGS - Everything is controllable
  features: {
    // Auth system
    auth: false,
    authMagicLinkFallback: true,

    // Multi-language support
    multiLanguage: false,

    // Analytics tracking
    analytics: false,

    // CRM webhook sync
    crmSync: false,
    crmQueue: true,

    // Idle popup
    idlePopup: false,

    // Security features (FORCED in production)
    rateLimiting: true, // Always true
    botProtection: false,
    payloadLimit: true,
    ipLogging: isDevelopment,
    ipAnonymization: isProduction,

    // UI features
    testimonials: true,

    // Marketing tracking
    gclid: true,
    utmTracking: true,

    // Monitoring
    sentry: false,
    slowResponseMonitor: isDevelopment,

    // Enrichment
    ipEnrichment: true,
    deviceDetection: true,

    // Images
    cloudflareImages: false,

    // Maintenance
    dataRetention: true,
    healthCheck: true,
    webhookSignature: true,
  },

  // Auth config
  auth: {
    providers: {
      google: {
        enabled: true,
      },
      magicLink: {
        enabled: true,
        tokenExpiry: 900, // 15 minutes
      },
    },
  },

  // Languages
  languages: {
    default: 'en' as const,
    available: ['en', 'es', 'fr'] as const,
  },

  // Security
  security: {
    rateLimitRequests: 10, // per minute
    rateLimitWindowMs: 60000, // 1 minute
    maxPayloadSize: 1048576, // 1MB
    allowedOrigins: [
      'https://your-domain.com',
      isDevelopment ? 'http://localhost:4321' : null,
    ].filter(Boolean) as string[],
  },

  // Data retention (GDPR)
  dataRetention: {
    quotesMaxAgeDays: 180,
    sessionsMaxAgeDays: 30,
    logsMaxAgeDays: 90,
  },

  // Monitoring
  monitoring: {
    slowResponseThresholdMs: 2000,
    errorAlertThreshold: 20,
  },

  // Debug
  debug: isDevelopment,
} as const;

/**
 * Get runtime config with environment variables
 * Use this in API routes to access runtime env vars
 *
 * CRITICAL: Always use this function, never import.meta.env in API routes
 */
export function getRuntimeConfig(env: any) {
  return {
    ...CONFIG,
    site: {
      ...CONFIG.site,
      // URL will be set dynamically in middleware
    },
    analytics: {
      gtmId: env.GTM_ID || '',
      ga4Id: env.GA4_ID || '',
    },
    crm: {
      webhookUrl: env.CRM_WEBHOOK_URL || '',
      apiKey: env.CRM_API_KEY || '',
      webhookSecret: env.CRM_WEBHOOK_SECRET || '',
      retryAttempts: 3,
      timeoutMs: 5000,
    },
    monitoring: {
      sentryDsn: env.SENTRY_DSN || '',
      environment: env.ENVIRONMENT || 'development',
      sampleRate: isProduction ? 0.1 : 1.0,
    },
    externalApis: {
      googleMaps: {
        enabled: !!env.GOOGLE_MAPS_API_KEY,
        apiKey: env.GOOGLE_MAPS_API_KEY || '',
        timeoutMs: 5000,
      },
    },
    auth: {
      ...CONFIG.auth,
      providers: {
        google: {
          enabled: CONFIG.auth.providers.google.enabled,
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
        magicLink: {
          enabled: CONFIG.auth.providers.magicLink.enabled,
          tokenExpiry: CONFIG.auth.providers.magicLink.tokenExpiry,
        },
      },
    },
    email: {
      resendApiKey: env.RESEND_API_KEY || '',
      from: CONFIG.calculator.emailFrom,
      timeoutMs: 5000,
    },
  };
}

// Type exports
export type Locale = (typeof CONFIG.languages.available)[number];
export type Feature = keyof typeof CONFIG.features;
export type RuntimeConfig = ReturnType<typeof getRuntimeConfig>;
