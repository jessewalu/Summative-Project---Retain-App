// Builds the Express app. Kept separate from index.js so it can be imported
// without opening a port (handy for scripts and future tests).
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budgets.js';
import categoryRoutes from './routes/categories.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();

  // Behind a proxy (Render, Railway, Heroku...) the real client IP is in X-Forwarded-For.
  // Without this, the rate limiter would see every visitor as the same address.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header means a non-browser client (curl, health checks), let it through.
        if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    })
  );
  app.use(express.json({ limit: '100kb' }));
  if (!config.isProduction) app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'retain-api', time: new Date().toISOString() });
  });

  // Slow down password guessing on the auth endpoints.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again in a few minutes' },
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
