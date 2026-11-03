import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './db.js';
import routes from './routes.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '../../');
const frontendDist = path.join(projectRoot, 'frontend', 'dist');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    styleSrcAttr: ["'unsafe-inline'"],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'blob:'],
    connectSrc: ["'self'", 'http://localhost:5173', 'http://localhost:5000', 'ws://localhost:5173'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"]
  } }
}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(here, '../uploads'), { maxAge: '1d' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api', routes);

if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Image must be 5 MB or smaller.' });
  if (err?.name === 'MulterError' || err?.message === 'Only JPG, PNG, WEBP, or GIF images are accepted.') return res.status(400).json({ error: err.message });
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

await initDatabase();
app.listen(port, () => console.log(`CampusFind API running at http://localhost:${port}`));
