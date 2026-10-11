// Authentication (who are you?) and authorization (are you allowed?) middleware.
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { forbidden, unauthorized } from '../utils/httpError.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * We re-read the user from the database on every request instead of trusting the
 * role stored in the token, that way a deleted user or a changed role takes effect
 * immediately and not whenever the token happens to expire.
 */
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Your session has expired, please sign in again');
  }

  const { rows } = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [payload.sub]
  );
  if (rows.length === 0) throw unauthorized('This account no longer exists');

  req.user = rows[0];
  next();
}

/** Must run after requireAuth. Lets only admins through. */
export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') throw forbidden('Admin access required');
  next();
}
