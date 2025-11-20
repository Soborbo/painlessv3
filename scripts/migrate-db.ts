/**
 * DATABASE MIGRATION HELPER
 * 
 * Runs pending migrations
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

async function runMigrations() {
  console.log('[Migrate] Starting database migrations...');

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('[Migrate] Missing database credentials');
    process.exit(1);
  }

  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const db = drizzle(client);

    console.log('[Migrate] Running migrations from ./db/migrations');

    await migrate(db, { migrationsFolder: './db/migrations' });

    console.log('[Migrate] ✓ Migrations complete');
    process.exit(0);
  } catch (error) {
    console.error('[Migrate] Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
