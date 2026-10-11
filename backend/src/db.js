// Thin wrapper around a pg connection pool.
import pg from 'pg';
import { config } from './config.js';

// By default node-postgres hands back DATE columns as JS Date objects (shifted by the
// server's timezone) and NUMERIC / BIGINT columns as strings. That bites you later when
// a "2026-03-01" expense shows up on the 28th of February, so we normalise them here.
pg.types.setTypeParser(1082, (value) => value); // DATE    -> 'YYYY-MM-DD'
pg.types.setTypeParser(1700, (value) => parseFloat(value)); // NUMERIC -> number
pg.types.setTypeParser(20, (value) => parseInt(value, 10)); // BIGINT (COUNT) -> number

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

pool.on('error', (err) => {
  // An idle client dying should not take the whole API down.
  console.error('Unexpected PostgreSQL error on an idle client:', err.message);
});

export const query = (text, params) => pool.query(text, params);

/**
 * Runs `work` inside a transaction. Rolls back if it throws, commits otherwise.
 * The callback receives a dedicated client, so every query in it shares the transaction.
 */
export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
