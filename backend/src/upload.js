import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.resolve(here, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extension = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' })[file.mimetype];
    cb(null, `${randomUUID()}${extension || ''}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new Error('Only JPG, PNG, WEBP, or GIF images are accepted.'));
    cb(null, true);
  }
});

export function removeUpload(filename) {
  if (!filename) return;
  const safe = path.basename(filename);
  const target = path.join(uploadDir, safe);
  if (target.startsWith(uploadDir) && fs.existsSync(target)) fs.unlinkSync(target);
}
