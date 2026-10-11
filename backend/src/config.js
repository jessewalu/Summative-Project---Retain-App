// Central place for every environment-driven setting.
// Reading them once here means the rest of the code never touches process.env directly.
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

// A missing JWT secret in production is a security hole, so we refuse to boot without one.
// In development we fall back to a throwaway value so `npm run dev` just works.
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/retain',
  // Hosted Postgres providers (Render, Neon, Supabase...) usually require SSL.
  // Set DATABASE_SSL=false if your provider or local setup does not use it.
  databaseSsl: isProduction && process.env.DATABASE_SSL !== 'false',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma separated list of origins allowed to call the API from a browser.
  clientOrigins: (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // The first admin account is created from these values on startup (if it does not exist yet).
  adminEmail: process.env.ADMIN_EMAIL || 'admin@retain.app',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  adminName: process.env.ADMIN_NAME || 'Retain Admin',
};
