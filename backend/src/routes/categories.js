// Read-only category list for the expense form and the filters.
// Creating, renaming and deleting categories lives under /api/admin.
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const { rows } = await query(
    'SELECT id, name, color, is_default FROM categories ORDER BY is_default DESC, name ASC'
  );
  res.json(rows.map((r) => ({ id: r.id, name: r.name, color: r.color, isDefault: r.is_default })));
});

export default router;
