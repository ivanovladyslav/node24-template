import express from 'express';
import multer from 'multer';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initDb, dbQuery, dbExec, storageUpload, storageDownload } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

app.get('/api', (req, res) => {
  res.json({
    message: 'Hello from Node.js 24 template',
    node: process.version,
    time: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/entries', async (req, res) => {
  try {
    const result = await dbQuery('SELECT * FROM entries ORDER BY id DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/entries', async (req, res) => {
  const { node_version, endpoint, image_key } = req.body;
  if (!node_version || !endpoint) {
    return res.status(400).json({ error: 'node_version and endpoint required' });
  }
  try {
    const result = await dbExec(
      'INSERT INTO entries (node_version, endpoint, image_key) VALUES (?, ?, ?)',
      [node_version.trim(), endpoint.trim(), image_key || null]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const ext = req.file.originalname.split('.').pop();
  const key = `entries/${Date.now()}.${ext}`;
  try {
    await storageUpload(key, req.file.buffer, req.file.mimetype);
    res.json({ key });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/image/*', async (req, res) => {
  const key = req.params[0];
  try {
    const response = await storageDownload(key);
    const ct = response.headers.get('content-type') || 'application/octet-stream';
    res.set('Content-Type', ct);
    res.set('Cache-Control', 'public, max-age=31536000');
    Readable.fromWeb(response.body).pipe(res);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await dbExec('DELETE FROM entries WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

await initDb();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
