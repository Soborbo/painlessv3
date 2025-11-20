globalThis.process ??= {}; globalThis.process.env ??= {};
const isProduction = true;
const isDevelopment = false;
const CONFIG = {
  // Site info (runtime-derived)
  site: {
    name: "Calculator Boilerplate",
    // URL is derived at runtime from request.url
    url: void 0,
    defaultLocale: "en"
  },
  // Calculator settings
  calculator: {
    currency: "HUF",
    phoneNumber: "+36-XX-XXX-XXXX",
    idleTimeSeconds: 20,
    emailFrom: "noreply@your-domain.com",
    emailSupport: "support@your-domain.com",
    schemaVersion: 1
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
    rateLimiting: true,
    // Always true
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
    webhookSignature: true
  },
  // Auth config
  auth: {
    providers: {
      google: {
        enabled: true
      },
      magicLink: {
        enabled: true,
        tokenExpiry: 900
        // 15 minutes
      }
    }
  },
  // Languages
  languages: {
    default: "en",
    available: ["en", "es", "fr"]
  },
  // Security
  security: {
    rateLimitRequests: 10,
    // per minute
    rateLimitWindowMs: 6e4,
    // 1 minute
    maxPayloadSize: 1048576,
    // 1MB
    allowedOrigins: [
      "https://your-domain.com",
      null
    ].filter(Boolean)
  },
  // Data retention (GDPR)
  dataRetention: {
    quotesMaxAgeDays: 180,
    sessionsMaxAgeDays: 30,
    logsMaxAgeDays: 90
  },
  // Monitoring
  monitoring: {
    slowResponseThresholdMs: 2e3,
    errorAlertThreshold: 20
  },
  // Debug
  debug: isDevelopment
};
function getRuntimeConfig(env) {
  return {
    ...CONFIG,
    site: {
      ...CONFIG.site
      // URL will be set dynamically in middleware
    },
    analytics: {
      gtmId: env.GTM_ID || "",
      ga4Id: env.GA4_ID || ""
    },
    crm: {
      webhookUrl: env.CRM_WEBHOOK_URL || "",
      apiKey: env.CRM_API_KEY || "",
      webhookSecret: env.CRM_WEBHOOK_SECRET || "",
      retryAttempts: 3,
      timeoutMs: 5e3
    },
    monitoring: {
      sentryDsn: env.SENTRY_DSN || "",
      environment: env.ENVIRONMENT || "development",
      sampleRate: 0.1 
    },
    externalApis: {
      googleMaps: {
        enabled: !!env.GOOGLE_MAPS_API_KEY,
        apiKey: env.GOOGLE_MAPS_API_KEY || "",
        timeoutMs: 5e3
      }
    },
    auth: {
      ...CONFIG.auth,
      providers: {
        google: {
          enabled: CONFIG.auth.providers.google.enabled,
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET
        },
        magicLink: {
          enabled: CONFIG.auth.providers.magicLink.enabled,
          tokenExpiry: CONFIG.auth.providers.magicLink.tokenExpiry
        }
      }
    },
    email: {
      resendApiKey: env.RESEND_API_KEY || "",
      from: CONFIG.calculator.emailFrom,
      timeoutMs: 5e3
    }
  };
}

function log(level, module, message, data) {
  if (level !== "error" && level !== "warn") {
    return;
  }
  const prefix = `[${level.toUpperCase()}][${module}]`;
  switch (level) {
    case "error":
      console.error(prefix, message, data || "");
      break;
    case "warn":
      console.warn(prefix, message, data || "");
      break;
    case "info":
      console.info(prefix, message, data || "");
      break;
    case "debug":
      console.debug(prefix, message, data || "");
      break;
  }
}
const logger = {
  debug: (module, message, data) => log("debug", module, message, data),
  info: (module, message, data) => log("info", module, message, data),
  warn: (module, message, data) => log("warn", module, message, data),
  error: (module, message, data) => log("error", module, message, data)
};

export { CONFIG as C, getRuntimeConfig as g, logger as l };
