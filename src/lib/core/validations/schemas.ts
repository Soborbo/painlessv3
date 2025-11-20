/**
 * VALIDATION SCHEMAS
 *
 * Zod schemas for request validation
 */

import { z } from 'zod';

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .min(5, 'Email too short')
  .max(255, 'Email too long');

/**
 * Phone validation (international)
 */
export const phoneSchema = z
  .string()
  .min(8, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number');

/**
 * Name validation
 */
export const nameSchema = z.string().trim().min(2, 'Name too short').max(100, 'Name too long');

/**
 * Language validation
 */
export const languageSchema = z.enum(['en', 'es', 'fr']);

/**
 * Currency validation
 */
export const currencySchema = z.enum(['HUF', 'EUR', 'USD', 'GBP']);

/**
 * Quote save schema
 */
export const saveQuoteSchema = z.object({
  // Calculator data
  data: z.record(z.unknown()),
  totalPrice: z.number().positive('Price must be positive'),
  breakdown: z.record(z.number()).optional(),
  currency: currencySchema.default('HUF'),

  // Contact info (optional)
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),

  // Language
  language: languageSchema.default('en'),

  // Marketing params (optional)
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  gclid: z.string().max(200).optional(),
});

/**
 * Calculate schema (for calculation endpoint)
 */
export const calculateSchema = z.object({
  step: z.string().min(1).max(50),
  data: z.record(z.unknown()),
  language: languageSchema.default('en'),
});

/**
 * Validate step schema (for step validation)
 */
export const validateStepSchema = z.object({
  step: z.string().min(1).max(50),
  data: z.record(z.unknown()),
});

/**
 * Email send schema
 */
export const sendEmailSchema = z.object({
  to: z.union([emailSchema, z.array(emailSchema)]),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  replyTo: emailSchema.optional(),
});

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  message: z.string().min(10, 'Message too short').max(1000, 'Message too long'),
  subject: z.string().max(200).optional(),
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * ID schema
 */
export const idSchema = z.number().int().positive();

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid();

// Type exports
export type SaveQuoteInput = z.infer<typeof saveQuoteSchema>;
export type CalculateInput = z.infer<typeof calculateSchema>;
export type ValidateStepInput = z.infer<typeof validateStepSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
