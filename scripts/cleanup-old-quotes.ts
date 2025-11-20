/**
 * DATA RETENTION SCRIPT
 * 
 * Deletes quotes older than 180 days (GDPR compliance)
 * Run as a cron job
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { quotes } from '../src/lib/core/db/schema';
import { lt, and, isNull } from 'drizzle-orm';
import { CONFIG } from '../src/lib/config';

async function cleanup() {
  console.log('[Cleanup] Starting data retention cleanup...');

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('[Cleanup] Missing database credentials');
    process.exit(1);
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client);

  try {
    // Calculate cutoff date (180 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.dataRetention.quotesMaxAgeDays);

    console.log(`[Cleanup] Soft deleting quotes older than ${cutoffDate.toISOString()}`);

    // Soft delete old quotes (set deletedAt)
    const softDeleteResult = await db
      .update(quotes)
      .set({ deletedAt: new Date() })
      .where(and(lt(quotes.createdAt, cutoffDate), isNull(quotes.deletedAt)));

    console.log(`[Cleanup] ✓ Marked ${softDeleteResult.rowsAffected} quotes for deletion`);

    // Hard delete quotes that were soft-deleted 30+ days ago
    const hardDeleteCutoff = new Date();
    hardDeleteCutoff.setDate(hardDeleteCutoff.getDate() - 210); // 180 + 30

    console.log(
      `[Cleanup] Hard deleting quotes soft-deleted before ${hardDeleteCutoff.toISOString()}`
    );

    const hardDeleteResult = await db.delete(quotes).where(lt(quotes.deletedAt, hardDeleteCutoff));

    console.log(`[Cleanup] ✓ Permanently deleted ${hardDeleteResult.rowsAffected} quotes`);

    console.log('[Cleanup] Complete');
    process.exit(0);
  } catch (error) {
    console.error('[Cleanup] Failed:', error);
    process.exit(1);
  }
}

cleanup();
