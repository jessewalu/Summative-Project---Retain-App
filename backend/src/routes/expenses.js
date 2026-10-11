// Expense CRUD plus search, filtering, sorting and pagination.
// Every query is scoped with `user_id = req.user.id`, which is what guarantees
// people can only ever read or touch their own expenses.
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { expenseBodySchema, expenseQuerySchema, idParamSchema } from '../schemas.js';
import { badRequest, notFound } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth);

// One SELECT used everywhere so every endpoint returns an identical expense shape.
const EXPENSE_SELECT = `
  SELECT e.id, e.title, e.amount, e.expense_date, e.payment_method, e.notes,
         e.created_at, e.updated_at,
         c.id AS category_id, c.name AS category_name, c.color AS category_color
  FROM expenses e
  JOIN categories c ON c.id = e.category_id
`;

const toExpense = (row) => ({
  id: row.id,
  title: row.title,
  amount: row.amount,
  date: row.expense_date,
  paymentMethod: row.payment_method,
  notes: row.notes,
  category: { id: row.category_id, name: row.category_name, color: row.category_color },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function categoryExists(id) {
  const { rowCount } = await query('SELECT 1 FROM categories WHERE id = $1', [id]);
  return rowCount > 0;
}

async function findOwnedExpense(expenseId, userId) {
  const { rows } = await query(`${EXPENSE_SELECT} WHERE e.id = $1 AND e.user_id = $2`, [
    expenseId,
    userId,
  ]);
  if (rows.length === 0) throw notFound('Expense not found');
  return toExpense(rows[0]);
}

// GET /api/expenses?search=&categoryId=&paymentMethod=&dateFrom=&dateTo=
//                  &minAmount=&maxAmount=&sortBy=date|amount&sortOrder=asc|desc&page=&limit=
router.get('/', async (req, res) => {
  const filters = expenseQuerySchema.parse(req.query);

  // Build the WHERE clause piece by piece. Values always go in as $n parameters,
  // never glued into the SQL string, so there is no room for SQL injection.
  const conditions = ['e.user_id = $1'];
  const params = [req.user.id];
  const add = (sql, value) => {
    params.push(value);
    // Every "?" in the snippet points at the same value (the search clause uses it twice).
    conditions.push(sql.replaceAll('?', () => `$${params.length}`));
  };

  if (filters.search) {
    // Escape LIKE wildcards so searching for "50%" does not match everything.
    const escaped = filters.search.replace(/[\\%_]/g, '\\$&');
    add('(e.title ILIKE ? OR e.notes ILIKE ?)', `%${escaped}%`);
  }
  if (filters.categoryId) add('e.category_id = ?', filters.categoryId);
  if (filters.paymentMethod) add('e.payment_method = ?', filters.paymentMethod);
  if (filters.dateFrom) add('e.expense_date >= ?', filters.dateFrom);
  if (filters.dateTo) add('e.expense_date <= ?', filters.dateTo);
  if (filters.minAmount != null) add('e.amount >= ?', filters.minAmount);
  if (filters.maxAmount != null) add('e.amount <= ?', filters.maxAmount);

  const where = conditions.join(' AND ');

  // The sort column and direction come from a validated enum, so it is safe to
  // place them in the SQL text. Ties fall back to newest-first for stable paging.
  const sortColumn = filters.sortBy === 'amount' ? 'e.amount' : 'e.expense_date';
  const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const offset = (filters.page - 1) * filters.limit;

  const [countResult, listResult] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(e.amount), 0) AS sum FROM expenses e WHERE ${where}`,
      params
    ),
    query(
      `${EXPENSE_SELECT}
       WHERE ${where}
       ORDER BY ${sortColumn} ${sortDirection}, e.created_at DESC, e.id DESC
       LIMIT ${filters.limit} OFFSET ${offset}`,
      params
    ),
  ]);

  const { total, sum } = countResult.rows[0];
  res.json({
    data: listResult.rows.map(toExpense),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
    // Total of everything matching the current filters (not just this page).
    filteredTotal: Math.round(sum * 100) / 100,
  });
});

router.get('/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await findOwnedExpense(id, req.user.id));
});

router.post('/', async (req, res) => {
  const body = expenseBodySchema.parse(req.body);
  if (!(await categoryExists(body.categoryId))) throw badRequest('That category does not exist');

  const { rows } = await query(
    `INSERT INTO expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [req.user.id, body.categoryId, body.title, body.amount, body.date, body.paymentMethod, body.notes]
  );

  res.status(201).json(await findOwnedExpense(rows[0].id, req.user.id));
});

router.put('/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = expenseBodySchema.parse(req.body);
  if (!(await categoryExists(body.categoryId))) throw badRequest('That category does not exist');

  // The user_id in the WHERE clause is the ownership check: someone else's id simply matches no rows.
  const { rowCount } = await query(
    `UPDATE expenses
     SET category_id = $1, title = $2, amount = $3, expense_date = $4,
         payment_method = $5, notes = $6, updated_at = NOW()
     WHERE id = $7 AND user_id = $8`,
    [body.categoryId, body.title, body.amount, body.date, body.paymentMethod, body.notes, id, req.user.id]
  );
  if (rowCount === 0) throw notFound('Expense not found');

  res.json(await findOwnedExpense(id, req.user.id));
});

router.delete('/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { rowCount } = await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [
    id,
    req.user.id,
  ]);
  if (rowCount === 0) throw notFound('Expense not found');
  res.status(204).end();
});

export default router;
