// Creates the tables, seeds the default categories and makes sure an admin exists.
// Every statement is idempotent, so it is safe to run on every server start.
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { query } from './db.js';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(40) NOT NULL,
  color      VARCHAR(7)  NOT NULL DEFAULT '#64748b',
  is_default BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique ON categories (LOWER(name));
-- Only one category may be the fallback ("Uncategorized").
CREATE UNIQUE INDEX IF NOT EXISTS categories_single_default ON categories (is_default) WHERE is_default;

CREATE TABLE IF NOT EXISTS expenses (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id    INTEGER       NOT NULL REFERENCES categories(id),
  title          VARCHAR(120)  NOT NULL,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date   DATE          NOT NULL,
  payment_method VARCHAR(20)   NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'other')),
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses (category_id);

CREATE TABLE IF NOT EXISTS budgets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month      CHAR(7)       NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month)
);
`;

// The starter set. "Uncategorized" is flagged as the default and cannot be removed,
// it is where expenses land when their category is deleted.
const starterCategories = [
  { name: 'Uncategorized', color: '#64748b', isDefault: true },
  { name: 'Food & Dining', color: '#f97316' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Housing', color: '#8b5cf6' },
  { name: 'Utilities', color: '#14b8a6' },
  { name: 'Health', color: '#ef4444' },
  { name: 'Entertainment', color: '#ec4899' },
  { name: 'Shopping', color: '#eab308' },
  { name: 'Education', color: '#22c55e' },
];

export async function setupDatabase() {
  await query(schema);

  for (const category of starterCategories) {
    await query(
      `INSERT INTO categories (name, color, is_default)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [category.name, category.color, Boolean(category.isDefault)]
    );
  }

  const { rows } = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [
    config.adminEmail,
  ]);
  if (rows.length === 0) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 12);
    await query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      [config.adminName, config.adminEmail, passwordHash]
    );
    console.log(`Created admin account: ${config.adminEmail}`);
  }
}
