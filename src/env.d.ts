/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        // Database
        TURSO_DATABASE_URL: string;
        TURSO_AUTH_TOKEN: string;

        // Email
        RESEND_API_KEY: string;

        // Site
        SITE_URL: string;
        ENVIRONMENT: string;

        // KV Namespaces (will add later)
        RATE_LIMITER?: KVNamespace;
        SESSIONS?: KVNamespace;
        CRM_QUEUE?: KVNamespace;
      };
      ctx: ExecutionContext;
    };
    sentry?: any; // Will type properly later
  }
}
