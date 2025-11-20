/**
 * DATABASE CLIENT
 *
 * Turso client factory (Edge-compatible)
 */

import { logger } from '@/lib/utils/logger';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export type DbClient = ReturnType<typeof createDbClient>;

interface DbCredentials {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

/**
 * Create database client
 *
 * IMPORTANT: Create a new client per request (Edge best practice)
 */
export function createDbClient(credentials: DbCredentials) {
  const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = credentials;

  if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    logger.error('DB', 'Missing database credentials');
    throw new Error('Database credentials not configured');
  }

  try {
    const client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    const db = drizzle(client, { schema });

    logger.debug('DB', 'Client created successfully');

    return db;
  } catch (error) {
    logger.error('DB', 'Failed to create client', { error });
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection(credentials: DbCredentials): Promise<boolean> {
  try {
    const client = createClient({
      url: credentials.TURSO_DATABASE_URL,
      authToken: credentials.TURSO_AUTH_TOKEN,
    });

    // Simple query to test connection
    await client.execute('SELECT 1');

    logger.info('DB', 'Connection test successful');
    return true;
  } catch (error) {
    logger.error('DB', 'Connection test failed', { error });
    return false;
  }
}
