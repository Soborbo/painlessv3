import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Users table
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Sessions table
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Magic link tokens table
 */
export const magicLinkTokens = sqliteTable('magic_link_tokens', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Calculator quotes table
 */
export const quotes = sqliteTable(
  'quotes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // User relation (optional)
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

    // Version control
    schemaVersion: integer('schema_version').notNull().default(1),

    // Fingerprint for duplicate prevention
    fingerprint: text('fingerprint').notNull().unique(),

    // Calculator data (JSON)
    calculatorData: text('calculator_data', { mode: 'json' })
      .$type<Record<string, unknown>>()
      .notNull(),

    // Result
    totalPrice: real('total_price').notNull(),
    currency: text('currency').notNull().default('HUF'),
    breakdown: text('breakdown', { mode: 'json' }).$type<Record<string, number>>(),

    // Contact info
    name: text('name'),
    email: text('email'),
    phone: text('phone'),

    // Language
    language: text('language').notNull().default('en'),

    // Enrichment data
    ipAddress: text('ip_address'), // Nullable (GDPR)
    ipAddressHash: text('ip_address_hash'), // Hashed IP (GDPR-safe)
    country: text('country'),
    city: text('city'),
    device: text('device'),
    userAgent: text('user_agent'),

    // Marketing tracking
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),
    gclid: text('gclid'),

    // Status
    status: text('status').notNull().default('new'),

    // CRM sync
    crmSynced: integer('crm_synced', { mode: 'boolean' }).notNull().default(false),
    crmId: text('crm_id'),
    crmSyncedAt: integer('crm_synced_at', { mode: 'timestamp' }),
    crmSyncAttempts: integer('crm_sync_attempts').notNull().default(0),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),

    // Soft delete for GDPR
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => ({
    // Indexes for performance
    fingerprintIdx: index('fingerprint_idx').on(table.fingerprint),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
    statusIdx: index('status_idx').on(table.status),
    crmSyncedIdx: index('crm_synced_idx').on(table.crmSynced),
    emailIdx: index('email_idx').on(table.email),
  })
);

/**
 * CRM sync queue table
 */
export const crmQueue = sqliteTable('crm_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteId: integer('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  nextRetryAt: integer('next_retry_at', { mode: 'timestamp' }),
  lastError: text('last_error'),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
});

/**
 * Testimonials table
 */
export const testimonials = sqliteTable('testimonials', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  name: text('name').notNull(),
  company: text('company'),
  role: text('role'),
  content: text('content').notNull(),
  rating: integer('rating').notNull(),
  image: text('image'),

  // Assignment
  pages: text('pages', { mode: 'json' }).$type<string[]>(),

  // Display settings
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  order: integer('order').notNull().default(0),

  // Language
  language: text('language').notNull().default('en'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type CRMQueueItem = typeof crmQueue.$inferSelect;
export type NewCRMQueueItem = typeof crmQueue.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
