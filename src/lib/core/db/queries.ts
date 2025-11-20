/**
 * DATABASE QUERIES
 *
 * Reusable query functions
 */

import { logger } from '@/lib/utils/logger';
import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import type { DbClient } from './client';
import { type NewQuote, type Quote, quotes } from './schema';

/**
 * Create a new quote
 */
export async function createQuote(db: DbClient, data: NewQuote): Promise<Quote | null> {
  try {
    const result = await db.insert(quotes).values(data).returning().get();

    logger.info('DB', 'Quote created', { id: result.id });
    return result;
  } catch (error) {
    logger.error('DB', 'Failed to create quote', { error });
    return null;
  }
}

/**
 * Get quote by ID
 */
export async function getQuoteById(db: DbClient, id: number): Promise<Quote | null> {
  try {
    const result = await db.select().from(quotes).where(eq(quotes.id, id)).get();

    return result || null;
  } catch (error) {
    logger.error('DB', 'Failed to get quote', { error, id });
    return null;
  }
}

/**
 * Get quote by fingerprint
 */
export async function getQuoteByFingerprint(
  db: DbClient,
  fingerprint: string
): Promise<Quote | null> {
  try {
    const result = await db.select().from(quotes).where(eq(quotes.fingerprint, fingerprint)).get();

    return result || null;
  } catch (error) {
    logger.error('DB', 'Failed to get quote by fingerprint', { error });
    return null;
  }
}

/**
 * Get recent quotes
 */
export async function getRecentQuotes(db: DbClient, limit = 10): Promise<Quote[]> {
  try {
    const results = await db
      .select()
      .from(quotes)
      .where(isNull(quotes.deletedAt))
      .orderBy(desc(quotes.createdAt))
      .limit(limit)
      .all();

    return results;
  } catch (error) {
    logger.error('DB', 'Failed to get recent quotes', { error });
    return [];
  }
}

/**
 * Get quotes by email
 */
export async function getQuotesByEmail(db: DbClient, email: string): Promise<Quote[]> {
  try {
    const results = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.email, email), isNull(quotes.deletedAt)))
      .orderBy(desc(quotes.createdAt))
      .all();

    return results;
  } catch (error) {
    logger.error('DB', 'Failed to get quotes by email', { error });
    return [];
  }
}

/**
 * Update quote
 */
export async function updateQuote(
  db: DbClient,
  id: number,
  data: Partial<NewQuote>
): Promise<Quote | null> {
  try {
    const result = await db
      .update(quotes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id))
      .returning()
      .get();

    logger.info('DB', 'Quote updated', { id });
    return result;
  } catch (error) {
    logger.error('DB', 'Failed to update quote', { error, id });
    return null;
  }
}

/**
 * Soft delete quote
 */
export async function softDeleteQuote(db: DbClient, id: number): Promise<boolean> {
  try {
    await db.update(quotes).set({ deletedAt: new Date() }).where(eq(quotes.id, id));

    logger.info('DB', 'Quote soft deleted', { id });
    return true;
  } catch (error) {
    logger.error('DB', 'Failed to soft delete quote', { error, id });
    return false;
  }
}

/**
 * Hard delete quote
 */
export async function hardDeleteQuote(db: DbClient, id: number): Promise<boolean> {
  try {
    await db.delete(quotes).where(eq(quotes.id, id));

    logger.info('DB', 'Quote hard deleted', { id });
    return true;
  } catch (error) {
    logger.error('DB', 'Failed to hard delete quote', { error, id });
    return false;
  }
}

/**
 * Get quotes for cleanup (older than X days)
 */
export async function getQuotesForCleanup(db: DbClient, daysOld: number): Promise<Quote[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const results = await db
      .select()
      .from(quotes)
      .where(and(isNull(quotes.deletedAt), lt(quotes.createdAt, cutoffDate)))
      .all();

    return results;
  } catch (error) {
    logger.error('DB', 'Failed to get quotes for cleanup', { error });
    return [];
  }
}

/**
 * Get quotes pending hard delete (soft deleted > 30 days ago)
 */
export async function getQuotesPendingHardDelete(
  db: DbClient,
  daysAfterSoftDelete = 30
): Promise<Quote[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAfterSoftDelete);

    const results = await db.select().from(quotes).where(lt(quotes.deletedAt, cutoffDate)).all();

    return results;
  } catch (error) {
    logger.error('DB', 'Failed to get quotes for hard delete', { error });
    return [];
  }
}

/**
 * Get quote statistics
 */
export async function getQuoteStats(db: DbClient): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, today, thisWeek, thisMonth] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(isNull(quotes.deletedAt))
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(and(gte(quotes.createdAt, todayStart), isNull(quotes.deletedAt)))
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(and(gte(quotes.createdAt, weekStart), isNull(quotes.deletedAt)))
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(and(gte(quotes.createdAt, monthStart), isNull(quotes.deletedAt)))
        .get(),
    ]);

    return {
      total: total?.count || 0,
      today: today?.count || 0,
      thisWeek: thisWeek?.count || 0,
      thisMonth: thisMonth?.count || 0,
    };
  } catch (error) {
    logger.error('DB', 'Failed to get quote stats', { error });
    return { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
  }
}
