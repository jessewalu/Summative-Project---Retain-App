// Admin-only endpoints: category management and platform-wide insights.
// Both middlewares run on every route in this file, so a normal user gets a 403
// no matter which endpoint they try.
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { categoryBodySchema, idParamSchema } from '../schemas.js';
import { currentMonth, money, monthRange } from '../utils/dates.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const toCategory = (row) => ({
  id: row.id,
  name: row.name,
  color: row.color,
  isDefault: row.is_default,
  expenseCount: row.expense_count ?? 0,
  createdAt: row.created_at,
});

// --- category management ----------------------------------------------------

router.get('/categories', async (_req, res) => {
  const { rows } = await query(`
    SELECT c.*, COUNT(e.id) AS expense_count
    FROM categories c
    LEFT JOIN expenses e ON e.category_id = c.id
    GROUP BY c.id
    ORDER BY c.is_default DESC, c.name ASC
  `);
  res.json(rows.map(toCategory));
});

router.post('/categories', async (req, res) => {
  const { name, color } = categoryBodySchema.parse(req.body);

  const duplicate = await query('SELECT 1 FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
  if (duplicate.rowCount > 0) throw conflict('A category with that name already exists');

  const { rows } = await query(
    'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *',
    [name, color]
  );
  res.status(201).json(toCategory(rows[0]));
});

router.put('/categories/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { name, color } = categoryBodySchema.parse(req.body);

  const existing = await query('SELECT * FROM categories WHERE id = $1', [id]);
  if (existing.rowCount === 0) throw notFound('Category not found');

  // The fallback category keeps its name, other code relies on it being recognisable.
  // Its colour can still be changed.
  if (existing.rows[0].is_default && name !== existing.rows[0].name) {
    throw badRequest('The default category cannot be renamed');
  }

  const duplicate = await query(
    'SELECT 1 FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2',
    [name, id]
  );
  if (duplicate.rowCount > 0) throw conflict('A category with that name already exists');

  const { rows } = await query(
    'UPDATE categories SET name = $1, color = $2 WHERE id = $3 RETURNING *',
    [name, color, id]
  );
  res.json(toCategory(rows[0]));
});

// Deleting a category must not orphan or destroy anyone's expenses. They are moved to
// the default "Uncategorized" category first, then the category is removed, all in
// one transaction so a failure half way leaves everything untouched.
router.delete('/categories/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTransaction(async (client) => {
    const found = await client.query('SELECT * FROM categories WHERE id = $1 FOR UPDATE', [id]);
    if (found.rowCount === 0) throw notFound('Category not found');
    if (found.rows[0].is_default) throw badRequest('The default category cannot be deleted');

    const fallback = await client.query('SELECT id, name FROM categories WHERE is_default');
    if (fallback.rowCount === 0) throw badRequest('No default category is configured');

    const moved = await client.query(
      'UPDATE expenses SET category_id = $1, updated_at = NOW() WHERE category_id = $2',
      [fallback.rows[0].id, id]
    );
    await client.query('DELETE FROM categories WHERE id = $1', [id]);

    return { reassignedExpenses: moved.rowCount, movedTo: fallback.rows[0].name };
  });

  res.json({ message: 'Category deleted', ...result });
});

// --- platform insights ------------------------------------------------------

router.get('/insights', async (_req, res) => {
  const { start, end } = monthRange(currentMonth());

  const [totals, thisMonth, perCategory, recentExpenses, recentUsers] = await Promise.all([
    query(`
      SELECT (SELECT COUNT(*) FROM users) AS total_users,
             COUNT(*) AS total_expenses,
             COALESCE(SUM(amount), 0) AS total_value
      FROM expenses
    `),
    query('SELECT COUNT(*) AS count FROM expenses WHERE expense_date >= $1 AND expense_date < $2', [
      start,
      end,
    ]),
    // LEFT JOIN so categories nobody has used yet still show up (with zeros),
    // which is what makes the "least used" list meaningful.
    query(`
      SELECT c.id, c.name, c.color, COUNT(e.id) AS usage_count, COALESCE(SUM(e.amount), 0) AS total
      FROM categories c
      LEFT JOIN expenses e ON e.category_id = c.id
      GROUP BY c.id
    `),
    query(`
      SELECT e.id, e.title, e.amount, e.expense_date, e.created_at,
             u.name AS user_name, c.name AS category_name, c.color AS category_color
      FROM expenses e
      JOIN users u ON u.id = e.user_id
      JOIN categories c ON c.id = e.category_id
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT 5
    `),
    query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT 5'),
  ]);

  const categories = perCategory.rows.map((r) => ({
    categoryId: r.id,
    name: r.name,
    color: r.color,
    expenseCount: r.usage_count,
    totalSpent: money(r.total),
  }));

  // Ties are broken by name so the lists stay stable between refreshes.
  const byName = (a, b) => a.name.localeCompare(b.name);
  const mostUsed = [...categories]
    .sort((a, b) => b.expenseCount - a.expenseCount || byName(a, b))
    .slice(0, 5);
  const leastUsed = [...categories]
    .sort((a, b) => a.expenseCount - b.expenseCount || byName(a, b))
    .slice(0, 5);

  res.json({
    totalUsers: totals.rows[0].total_users,
    totalExpenses: totals.rows[0].total_expenses,
    totalExpenseValue: money(totals.rows[0].total_value),
    expensesThisMonth: thisMonth.rows[0].count,
    spendingPerCategory: [...categories].sort((a, b) => b.totalSpent - a.totalSpent),
    topCategories: mostUsed,
    bottomCategories: leastUsed,
    recentExpenses: recentExpenses.rows.map((r) => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      date: r.expense_date,
      createdAt: r.created_at,
      userName: r.user_name,
      category: { name: r.category_name, color: r.category_color },
    })),
    recentUsers: recentUsers.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      createdAt: r.created_at,
    })),
  });
});

export default router;
