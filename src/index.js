import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initDb, dbQuery, dbExec } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

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
  const { node_version, endpoint } = req.body;
  if (!node_version || !endpoint) {
    return res.status(400).json({ error: 'node_version and endpoint required' });
  }
  try {
    const result = await dbExec(
      'INSERT INTO entries (node_version, endpoint) VALUES (?, ?)',
      [node_version.trim(), endpoint.trim()]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
