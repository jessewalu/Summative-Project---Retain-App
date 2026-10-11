// Monthly budgets. One budget per user per month, identified by "YYYY-MM".
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { budgetBodySchema, monthParamSchema } from '../schemas.js';
import { budgetStatus, money, monthRange } from '../utils/dates.js';
import { notFound } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth);

/** Works out spent / remaining / status for one user and month. */
export async function buildBudgetSummary(userId, month) {
  const { start, end } = monthRange(month);

  const [budgetResult, spentResult] = await Promise.all([
    query('SELECT amount FROM budgets WHERE user_id = $1 AND month = $2', [userId, month]),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS spent
       FROM expenses
       WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3`,
      [userId, start, end]
    ),
  ]);

  const budget = budgetResult.rows[0]?.amount ?? null;
  const spent = money(spentResult.rows[0].spent);

  return {
    month,
    budget,
    spent,
    remaining: budget == null ? null : money(budget - spent),
    percentUsed: budget == null ? null : Math.round((spent / budget) * 1000) / 10,
    status: budgetStatus(spent, budget),
  };
}

// All budgets the user has ever set, newest month first.
router.get('/', async (req, res) => {
  const { rows } = await query(
    'SELECT month, amount FROM budgets WHERE user_id = $1 ORDER BY month DESC',
    [req.user.id]
  );
  res.json(rows);
});

router.get('/:month', async (req, res) => {
  const { month } = monthParamSchema.parse(req.params);
  res.json(await buildBudgetSummary(req.user.id, month));
});

// Creates the budget for that month, or updates it if one already exists.
router.put('/:month', async (req, res) => {
  const { month } = monthParamSchema.parse(req.params);
  const { amount } = budgetBodySchema.parse(req.body);

  await query(
    `INSERT INTO budgets (user_id, month, amount)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, month)
     DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()`,
    [req.user.id, month, amount]
  );

  res.json(await buildBudgetSummary(req.user.id, month));
});

router.delete('/:month', async (req, res) => {
  const { month } = monthParamSchema.parse(req.params);
  const { rowCount } = await query('DELETE FROM budgets WHERE user_id = $1 AND month = $2', [
    req.user.id,
    month,
  ]);
  if (rowCount === 0) throw notFound('No budget is set for that month');
  res.status(204).end();
});

export default router;
