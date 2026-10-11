// Everything the user dashboard needs for one month, in a single round trip.
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { dashboardQuerySchema } from '../schemas.js';
import { currentMonth, money, monthRange } from '../utils/dates.js';
import { buildBudgetSummary } from './budgets.js';

const router = Router();
router.use(requireAuth);

const mapExpense = (row) => ({
  id: row.id,
  title: row.title,
  amount: row.amount,
  date: row.expense_date,
  paymentMethod: row.payment_method,
  category: { id: row.category_id, name: row.category_name, color: row.category_color },
});

router.get('/', async (req, res) => {
  const { month = currentMonth() } = dashboardQuerySchema.parse(req.query);
  const { start, end } = monthRange(month);
  const userId = req.user.id;
  const range = [userId, start, end];

  const monthExpenses = `
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    WHERE e.user_id = $1 AND e.expense_date >= $2 AND e.expense_date < $3
  `;
  const columns = `e.id, e.title, e.amount, e.expense_date, e.payment_method,
                   c.id AS category_id, c.name AS category_name, c.color AS category_color`;

  const [budget, count, highest, byCategory, recent] = await Promise.all([
    buildBudgetSummary(userId, month),
    query(`SELECT COUNT(*) AS count ${monthExpenses}`, range),
    query(`SELECT ${columns} ${monthExpenses} ORDER BY e.amount DESC, e.id DESC LIMIT 1`, range),
    query(
      `SELECT c.id, c.name, c.color, SUM(e.amount) AS total, COUNT(*) AS count
       ${monthExpenses}
       GROUP BY c.id, c.name, c.color
       ORDER BY total DESC`,
      range
    ),
    query(
      `SELECT ${columns} ${monthExpenses}
       ORDER BY e.expense_date DESC, e.created_at DESC, e.id DESC LIMIT 5`,
      range
    ),
  ]);

  const totalSpent = budget.spent;

  res.json({
    month,
    totalSpent,
    expenseCount: count.rows[0].count,
    budget: {
      amount: budget.budget,
      remaining: budget.remaining,
      percentUsed: budget.percentUsed,
      status: budget.status,
    },
    highestExpense: highest.rows[0] ? mapExpense(highest.rows[0]) : null,
    spendingByCategory: byCategory.rows.map((r) => ({
      categoryId: r.id,
      name: r.name,
      color: r.color,
      total: money(r.total),
      count: r.count,
      // Share of the month's spending, handy for the donut chart legend.
      percentage: totalSpent > 0 ? Math.round((r.total / totalSpent) * 1000) / 10 : 0,
    })),
    recentExpenses: recent.rows.map(mapExpense),
  });
});

export default router;
