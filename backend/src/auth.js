import jwt from 'jsonwebtoken';
import { get } from './db.js';

const secret = () => process.env.JWT_SECRET || 'development-only-change-this-secret';

export function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: '7d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    const payload = jwt.verify(token, secret());
    const user = get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [payload.id]);
    if (!user) return res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access is required.' });
  next();
}
