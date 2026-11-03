import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dataDir = path.resolve(here, '../data');
const dbPath = path.join(dataDir, 'campusfind.sqlite');
let db;

export async function initDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });
  // sql.js ships its WebAssembly binary beside its JavaScript entry point.
  const wasmDir = path.dirname(require.resolve('sql.js'));
  const engine = await initSqlJs({ locateFile: (file) => path.join(wasmDir, file) });
  const fileExists = fs.existsSync(dbPath);
  db = fileExists ? new engine.Database(new Uint8Array(fs.readFileSync(dbPath))) : new engine.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      item_date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('lost','found')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','resolved','removed')),
      image_path TEXT,
      contact_info TEXT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      claimant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(item_id, claimant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_items_status_type ON items(status, type);
    CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_claims_item ON claims(item_id);
  `);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campusfind.edu').toLowerCase();
  const admin = get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!admin) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin123!', 10);
    run('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', [process.env.ADMIN_NAME || 'CampusFind Admin', adminEmail, hash, 'admin']);
  }

  const count = get("SELECT COUNT(*) AS count FROM items WHERE status != 'removed'");
  if (count.count === 0) {
    const demoUsers = [
      ['Aarav Sharma', 'aarav.demo@campusfind.edu', bcrypt.hashSync('Student123!', 10)],
      ['Diya Nair', 'diya.demo@campusfind.edu', bcrypt.hashSync('Student123!', 10)],
      ['Rohan Mehta', 'rohan.demo@campusfind.edu', bcrypt.hashSync('Student123!', 10)]
    ];
    for (const user of demoUsers) run('INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', [...user, 'student']);
    const users = all('SELECT id,email FROM users WHERE email LIKE ? ORDER BY id', ['%.demo@campusfind.edu']);
    const byEmail = Object.fromEntries(users.map((u) => [u.email, u.id]));
    const samples = [
      ['Black wireless earbuds', 'A black earbuds case was left on one of the library study tables. Please share a detail only the owner would know.', 'Electronics', 'Central Library', '2026-10-28', 'found', 'aarav.demo@campusfind.edu', null],
      ['Blue water bottle', 'Lost a blue insulated water bottle with a small mountain sticker. Last seen after the afternoon class.', 'Accessories', 'Academic Block B', '2026-10-29', 'lost', 'diya.demo@campusfind.edu', null],
      ['Scientific calculator', 'Found a Casio scientific calculator near the first-floor staircase. It is safe with me.', 'Stationery', 'Engineering Block', '2026-10-30', 'found', 'rohan.demo@campusfind.edu', null],
      ['Student ID card', 'Misplaced my college ID card around lunchtime. The card has a blue lanyard.', 'Documents', 'Main Canteen', '2026-10-27', 'lost', 'aarav.demo@campusfind.edu', null],
      ['USB drive', 'Found a small silver 32 GB USB drive outside the computer laboratory.', 'Electronics', 'Computer Lab', '2026-10-31', 'found', 'diya.demo@campusfind.edu', null]
    ];
    for (const [title, description, category, location, date, type, email, image] of samples) {
      run('INSERT INTO items (title,description,category,location,item_date,type,user_id,image_path) VALUES (?,?,?,?,?,?,?,?)', [title, description, category, location, date, type, byEmail[email], image]);
    }
  }
  saveDatabase();
  return db;
}

export function saveDatabase() {
  if (!db) return;
  const bytes = db.export();
  fs.writeFileSync(dbPath, Buffer.from(bytes));
}

function bind(stmt, params = []) { stmt.bind(params); }
export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  bind(stmt, params);
  stmt.step();
  stmt.free();
  const changes = db.getRowsModified();
  saveDatabase();
  return { changes };
}
export function get(sql, params = []) {
  const stmt = db.prepare(sql);
  bind(stmt, params);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}
export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  bind(stmt, params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
