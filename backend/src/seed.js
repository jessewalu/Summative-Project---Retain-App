// Fills the database with a demo account and a few months of believable spending,
// so the dashboard and charts have something to show during a demo.
//
//   npm run seed
//
// Safe to run more than once: it removes the previous demo user (and, through
// ON DELETE CASCADE, their expenses and budgets) before creating a fresh one.
import bcrypt from 'bcryptjs';
import { pool, query } from './db.js';
import { setupDatabase } from './setup.js';
import { PAYMENT_METHODS } from './schemas.js';

const DEMO_EMAIL = 'demo@retain.app';
const DEMO_PASSWORD = 'Demo1234';

// [title, category, typical amount, payment method]. Amounts get a little random wobble below.
const habits = [
  ['Weekly groceries', 'Food & Dining', 850, 'card'],
  ['Coffee run', 'Food & Dining', 45, 'cash'],
  ['Takeaway dinner', 'Food & Dining', 190, 'mobile_money'],
  ['Fuel', 'Transport', 700, 'card'],
  ['Ride home', 'Transport', 95, 'mobile_money'],
  ['Electricity top-up', 'Utilities', 500, 'bank_transfer'],
  ['Internet', 'Utilities', 599, 'bank_transfer'],
  ['Gym membership', 'Health', 450, 'bank_transfer'],
  ['Pharmacy', 'Health', 160, 'card'],
  ['Movie night', 'Entertainment', 180, 'card'],
  ['Streaming subscription', 'Entertainment', 119, 'card'],
  ['New sneakers', 'Shopping', 1200, 'card'],
  ['Online course', 'Education', 650, 'card'],
];

const pad = (n) => String(n).padStart(2, '0');

// Same pseudo-random numbers every run, so the demo always looks the same.
let seedState = 42;
const random = () => {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
};

async function main() {
  await setupDatabase();

  await query('DELETE FROM users WHERE LOWER(email) = $1', [DEMO_EMAIL]);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'user') RETURNING id`,
    ['Demo User', DEMO_EMAIL, passwordHash]
  );
  const userId = rows[0].id;

  const categoryRows = (await query('SELECT id, name FROM categories')).rows;
  const categoryId = (name) => categoryRows.find((c) => c.name === name)?.id;

  const now = new Date();
  let created = 0;

  // The current month plus the two before it.
  for (let back = 0; back < 3; back++) {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const year = first.getUTCFullYear();
    const monthNumber = first.getUTCMonth() + 1;
    const month = `${year}-${pad(monthNumber)}`;
    // For the current month only use days that have already happened.
    const lastDay = back === 0 ? now.getUTCDate() : new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    for (const [title, category, typical, method] of habits) {
      const id = categoryId(category);
      if (!id || !PAYMENT_METHODS.includes(method)) continue;
      // Some habits repeat within a month, others happen once.
      const times = typical < 200 ? 2 : 1;
      for (let i = 0; i < times; i++) {
        const day = 1 + Math.floor(random() * lastDay);
        const amount = Math.round(typical * (0.8 + random() * 0.45) * 100) / 100;
        await query(
          `INSERT INTO expenses (user_id, category_id, title, amount, expense_date, payment_method)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, id, title, amount, `${month}-${pad(day)}`, method]
        );
        created++;
      }
    }

    await query('INSERT INTO budgets (user_id, month, amount) VALUES ($1, $2, $3)', [
      userId,
      month,
      back === 0 ? 9000 : 8000,
    ]);
  }

  console.log(`Seeded ${created} expenses for ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
