// Sign up, sign in, and "who am I" for restoring a session after a page refresh.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../schemas.js';
import { conflict, unauthorized } from '../utils/httpError.js';

const router = Router();

// What we are willing to tell the browser about a user. Never the password hash.
const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});

router.post('/register', async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);

  const existing = await query('SELECT 1 FROM users WHERE LOWER(email) = $1', [email]);
  if (existing.rowCount > 0) throw conflict('An account with that email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  // The role is never taken from the request: public sign-ups are always plain users.
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash]
  );

  const user = rows[0];
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
  const user = rows[0];

  // Same message for "no such user" and "wrong password" so the API does not
  // reveal which emails are registered.
  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));
  if (!passwordMatches) throw unauthorized('Incorrect email or password');

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
