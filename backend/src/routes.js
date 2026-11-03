import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { all, get, run } from './db.js';
import { createToken, requireAuth, requireAdmin } from './auth.js';
import { upload, removeUpload } from './upload.js';

const router = Router();
const publicUser = (user) => user ? ({ id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at }) : null;
const itemSelect = `SELECT i.*, u.name AS owner_name
  FROM items i JOIN users u ON u.id = i.user_id`;
const cleanItem = (item) => item ? ({ ...item, image_url: item.image_path ? `/uploads/${encodeURIComponent(item.image_path)}` : null }) : null;

router.get('/health', (_req, res) => res.json({ ok: true, name: 'CampusFind API' }));

// Authentication
router.post('/auth/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 60) return res.status(400).json({ error: 'Name must be between 2 and 60 characters.' });
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 120) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters.' });
    if (get('SELECT id FROM users WHERE email = ?', [email])) return res.status(409).json({ error: 'An account with this email already exists.' });
    const hash = await bcrypt.hash(password, 10);
    run('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', [name, email, hash, 'student']);
    const user = get('SELECT id,name,email,role,created_at FROM users WHERE email = ?', [email]);
    res.status(201).json({ user: publicUser(user), token: createToken(user) });
  } catch (error) { next(error); }
});

router.post('/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Incorrect email or password.' });
    res.json({ user: publicUser(user), token: createToken(user) });
  } catch (error) { next(error); }
});

router.get('/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// Item discovery. Search and filters are server-side so they work with real stored records.
router.get('/items', (req, res) => {
  const where = ["i.status != 'removed'"];
  const values = [];
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || '').trim();
  const category = String(req.query.category || '').trim();
  const location = String(req.query.location || '').trim();
  const status = String(req.query.status || 'active').trim();
  if (q) { where.push('(i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ?)'); values.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (['lost', 'found'].includes(type)) { where.push('i.type = ?'); values.push(type); }
  if (category && category !== 'All categories') { where.push('i.category = ?'); values.push(category); }
  if (location) { where.push('i.location LIKE ?'); values.push(`%${location}%`); }
  if (status === 'all') {} else if (['active', 'resolved'].includes(status)) { where.push('i.status = ?'); values.push(status); }
  const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 100);
  const items = all(`${itemSelect} WHERE ${where.join(' AND ')} ORDER BY CASE WHEN i.status='active' THEN 0 ELSE 1 END, i.created_at DESC LIMIT ?`, [...values, limit]);
  res.json({ items: items.map(cleanItem) });
});

router.get('/items/mine', requireAuth, (req, res) => {
  const items = all(`${itemSelect} WHERE i.user_id = ? AND i.status != 'removed' ORDER BY i.created_at DESC`, [req.user.id]);
  res.json({ items: items.map(cleanItem) });
});

router.get('/items/:id', (req, res) => {
  const item = get(`${itemSelect} WHERE i.id = ? AND i.status != 'removed'`, [Number(req.params.id)]);
  if (!item) return res.status(404).json({ error: 'This listing could not be found.' });
  const claimsCount = get("SELECT COUNT(*) AS count FROM claims WHERE item_id = ? AND status = 'pending'", [item.id]).count;
  res.json({ item: { ...cleanItem(item), pending_claims: claimsCount } });
});

router.post('/items', requireAuth, upload.single('image'), (req, res, next) => {
  try {
    const { title, description, category, location, item_date, type, contact_info } = req.body;
    const validType = ['lost', 'found'].includes(type);
    if (!title?.trim() || title.trim().length > 100) return res.status(400).json({ error: 'Enter an item name (up to 100 characters).' });
    if (!description?.trim() || description.trim().length < 10 || description.trim().length > 1500) return res.status(400).json({ error: 'Description must be between 10 and 1,500 characters.' });
    if (!category?.trim() || !location?.trim() || !item_date || !validType) return res.status(400).json({ error: 'Please complete all required item details.' });
    run(`INSERT INTO items (title,description,category,location,item_date,type,image_path,contact_info,user_id)
      VALUES (?,?,?,?,?,?,?,?,?)`, [title.trim(), description.trim(), category.trim(), location.trim(), item_date, type, req.file?.filename || null, String(contact_info || '').trim(), req.user.id]);
    const item = get(`${itemSelect} WHERE i.id = last_insert_rowid()`);
    res.status(201).json({ item: cleanItem(item), message: 'Your report has been published.' });
  } catch (error) { if (req.file) removeUpload(req.file.filename); next(error); }
});

router.patch('/items/:id', requireAuth, upload.single('image'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = get('SELECT * FROM items WHERE id = ? AND status != ?', [id, 'removed']);
    if (!item) { if (req.file) removeUpload(req.file.filename); return res.status(404).json({ error: 'Listing not found.' }); }
    if (item.user_id !== req.user.id && req.user.role !== 'admin') { if (req.file) removeUpload(req.file.filename); return res.status(403).json({ error: 'You can only edit your own listings.' }); }
    const fields = {
      title: String(req.body.title ?? item.title).trim(),
      description: String(req.body.description ?? item.description).trim(),
      category: String(req.body.category ?? item.category).trim(),
      location: String(req.body.location ?? item.location).trim(),
      item_date: String(req.body.item_date ?? item.item_date),
      type: ['lost', 'found'].includes(req.body.type) ? req.body.type : item.type,
      contact_info: String(req.body.contact_info ?? item.contact_info ?? '').trim(),
      status: ['active', 'resolved'].includes(req.body.status) ? req.body.status : item.status,
      image_path: req.file?.filename || item.image_path
    };
    if (!fields.title || fields.description.length < 10 || !fields.category || !fields.location) { if (req.file) removeUpload(req.file.filename); return res.status(400).json({ error: 'Please provide valid item details.' }); }
    run(`UPDATE items SET title=?,description=?,category=?,location=?,item_date=?,type=?,contact_info=?,status=?,image_path=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`, [...Object.values(fields), id]);
    if (req.file && item.image_path) removeUpload(item.image_path);
    const updated = get(`${itemSelect} WHERE i.id = ?`, [id]);
    res.json({ item: cleanItem(updated), message: 'Listing updated.' });
  } catch (error) { if (req.file) removeUpload(req.file.filename); next(error); }
});

router.delete('/items/:id', requireAuth, (req, res) => {
  const item = get('SELECT * FROM items WHERE id = ? AND status != ?', [Number(req.params.id), 'removed']);
  if (!item) return res.status(404).json({ error: 'Listing not found.' });
  if (item.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only remove your own listings.' });
  run("UPDATE items SET status='removed',updated_at=CURRENT_TIMESTAMP WHERE id=?", [item.id]);
  res.json({ message: 'Listing removed.' });
});

// Claims: a student can claim a found item; only its owner (or an admin) can decide.
router.post('/items/:id/claims', requireAuth, (req, res) => {
  const item = get('SELECT * FROM items WHERE id = ? AND status = ?', [Number(req.params.id), 'active']);
  if (!item) return res.status(404).json({ error: 'This active listing could not be found.' });
  if (item.type !== 'found') return res.status(400).json({ error: 'Claims can be submitted for found-item listings.' });
  if (item.user_id === req.user.id) return res.status(400).json({ error: 'You cannot claim an item that you reported.' });
  const message = String(req.body.message || '').trim();
  if (message.length < 10 || message.length > 800) return res.status(400).json({ error: 'Please add a claim message of 10–800 characters.' });
  if (get('SELECT id FROM claims WHERE item_id = ? AND claimant_id = ?', [item.id, req.user.id])) return res.status(409).json({ error: 'You have already submitted a claim for this listing.' });
  run('INSERT INTO claims (item_id,claimant_id,message) VALUES (?,?,?)', [item.id, req.user.id, message]);
  res.status(201).json({ message: 'Your claim has been sent to the person who reported the item.' });
});

router.get('/claims/mine', requireAuth, (req, res) => {
  const sent = all(`SELECT c.*, i.title AS item_title, i.type AS item_type, i.status AS item_status, i.image_path, u.name AS owner_name
    FROM claims c JOIN items i ON i.id=c.item_id JOIN users u ON u.id=i.user_id
    WHERE c.claimant_id=? AND i.status!='removed' ORDER BY c.created_at DESC`, [req.user.id]);
  const received = all(`SELECT c.*, i.title AS item_title, i.type AS item_type, i.status AS item_status, i.image_path, u.name AS claimant_name, u.email AS claimant_email
    FROM claims c JOIN items i ON i.id=c.item_id JOIN users u ON u.id=c.claimant_id
    WHERE i.user_id=? AND i.status!='removed' ORDER BY c.created_at DESC`, [req.user.id]);
  res.json({ sent: sent.map((c) => ({ ...c, image_url: c.image_path ? `/uploads/${encodeURIComponent(c.image_path)}` : null })), received: received.map((c) => ({ ...c, image_url: c.image_path ? `/uploads/${encodeURIComponent(c.image_path)}` : null })) });
});

router.patch('/claims/:id/:decision', requireAuth, (req, res) => {
  const claim = get(`SELECT c.*, i.user_id AS owner_id, i.id AS item_id FROM claims c JOIN items i ON i.id=c.item_id WHERE c.id=?`, [Number(req.params.id)]);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (claim.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Only the listing owner can decide this claim.' });
  if (claim.status !== 'pending') return res.status(409).json({ error: 'This claim has already been decided.' });
  const decision = req.params.decision;
  if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ error: 'Decision must be approve or reject.' });
  if (decision === 'approve') {
    run("UPDATE claims SET status='approved' WHERE id=?", [claim.id]);
    run("UPDATE claims SET status='rejected' WHERE item_id=? AND id!=? AND status='pending'", [claim.item_id, claim.id]);
    run("UPDATE items SET status='resolved',updated_at=CURRENT_TIMESTAMP WHERE id=?", [claim.item_id]);
  } else run("UPDATE claims SET status='rejected' WHERE id=?", [claim.id]);
  res.json({ message: decision === 'approve' ? 'Claim approved. The item is now marked resolved.' : 'Claim rejected.' });
});

// Admin area
router.get('/admin/overview', requireAuth, requireAdmin, (_req, res) => {
  const stats = {
    totalItems: get("SELECT COUNT(*) AS count FROM items WHERE status!='removed'").count,
    lostItems: get("SELECT COUNT(*) AS count FROM items WHERE type='lost' AND status='active'").count,
    foundItems: get("SELECT COUNT(*) AS count FROM items WHERE type='found' AND status='active'").count,
    resolvedItems: get("SELECT COUNT(*) AS count FROM items WHERE status='resolved'").count,
    totalUsers: get('SELECT COUNT(*) AS count FROM users WHERE role=\'student\'').count,
    pendingClaims: get("SELECT COUNT(*) AS count FROM claims WHERE status='pending'").count
  };
  const recentItems = all(`${itemSelect} WHERE i.status!='removed' ORDER BY i.created_at DESC LIMIT 8`).map(cleanItem);
  res.json({ stats, recentItems });
});

router.get('/admin/items', requireAuth, requireAdmin, (req, res) => {
  const type = ['lost', 'found'].includes(req.query.type) ? req.query.type : null;
  const status = ['active', 'resolved'].includes(req.query.status) ? req.query.status : null;
  const where = ["i.status!='removed'"];
  const params = [];
  if (type) { where.push('i.type=?'); params.push(type); }
  if (status) { where.push('i.status=?'); params.push(status); }
  const items = all(`${itemSelect} WHERE ${where.join(' AND ')} ORDER BY i.created_at DESC LIMIT 100`, params);
  res.json({ items: items.map(cleanItem) });
});

router.get('/admin/users', requireAuth, requireAdmin, (_req, res) => {
  const users = all(`SELECT u.id,u.name,u.email,u.role,u.created_at,COUNT(i.id) AS item_count
    FROM users u LEFT JOIN items i ON i.user_id=u.id AND i.status!='removed'
    GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`);
  res.json({ users });
});

router.patch('/admin/items/:id/remove', requireAuth, requireAdmin, (req, res) => {
  const item = get('SELECT id FROM items WHERE id=? AND status!=\'removed\'', [Number(req.params.id)]);
  if (!item) return res.status(404).json({ error: 'Listing not found.' });
  run("UPDATE items SET status='removed',updated_at=CURRENT_TIMESTAMP WHERE id=?", [item.id]);
  res.json({ message: 'Listing removed by administrator.' });
});

export default router;
