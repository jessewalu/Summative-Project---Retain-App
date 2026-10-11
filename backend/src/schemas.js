// Request validation. Everything that comes from the outside gets checked here first.
import { z } from 'zod';
import { MONTH_PATTERN } from './utils/dates.js';

export const PAYMENT_METHODS = ['cash', 'card', 'mobile_money', 'bank_transfer', 'other'];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// "2026-02-31" matches the pattern but is not a real day, so we also round-trip it.
const isRealDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const dateString = z.string().refine(isRealDate, 'Use a real date in YYYY-MM-DD format');
const month = z.string().regex(MONTH_PATTERN, 'Month must look like 2026-03');
const amount = z.coerce
  .number({ error: 'Amount must be a number' })
  .positive('Amount must be greater than zero')
  .max(1_000_000_000, 'That amount is too large')
  .transform((n) => Math.round(n * 100) / 100);

// --- auth -------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(255)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be 72 characters or fewer')
    .regex(/[A-Za-z]/, 'Password needs at least one letter')
    .regex(/\d/, 'Password needs at least one number'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

// --- expenses ---------------------------------------------------------------

export const expenseBodySchema = z.object({
  title: z.string().trim().min(1, 'Give the expense a title').max(120),
  amount,
  categoryId: z.coerce.number().int().positive('Pick a category'),
  date: dateString,
  paymentMethod: z.enum(PAYMENT_METHODS, { error: 'Pick a payment method' }),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes can be up to 1000 characters')
    .optional()
    .transform((value) => (value ? value : null)),
});

// Query-string filters. Empty strings (what a cleared form field sends) count as "not set".
// The optional default has to live *inside* the preprocess step, otherwise a cleared
// field ('') would turn into undefined after the default had already been skipped.
const blankToUndefined = (value) => (value === '' || value == null ? undefined : value);
const optional = (schema, fallback) =>
  z.preprocess(
    blankToUndefined,
    fallback === undefined ? schema.optional() : schema.default(fallback)
  );

export const expenseQuerySchema = z
  .object({
    search: optional(z.string().trim().max(120)),
    categoryId: optional(z.coerce.number().int().positive()),
    paymentMethod: optional(z.enum(PAYMENT_METHODS)),
    dateFrom: optional(dateString),
    dateTo: optional(dateString),
    minAmount: optional(z.coerce.number().min(0)),
    maxAmount: optional(z.coerce.number().min(0)),
    sortBy: optional(z.enum(['date', 'amount']), 'date'),
    sortOrder: optional(z.enum(['asc', 'desc']), 'desc'),
    page: optional(z.coerce.number().int().min(1), 1),
    limit: optional(z.coerce.number().int().min(1).max(100), 10),
  })
  .refine((q) => !q.dateFrom || !q.dateTo || q.dateFrom <= q.dateTo, {
    message: 'The start date cannot be after the end date',
    path: ['dateFrom'],
  })
  .refine((q) => q.minAmount == null || q.maxAmount == null || q.minAmount <= q.maxAmount, {
    message: 'Minimum amount cannot be higher than the maximum',
    path: ['minAmount'],
  });

// --- budgets & dashboard ----------------------------------------------------

export const monthParamSchema = z.object({ month });
export const budgetBodySchema = z.object({ amount });
export const dashboardQuerySchema = z.object({ month: optional(month) });

// --- categories -------------------------------------------------------------

export const categoryBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #3b82f6')
    .default('#64748b'),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid id'),
});
