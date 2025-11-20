import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/core/db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  },
} satisfies Config;
