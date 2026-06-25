const BASE_URL = process.env.RUNTIME_BASE_URL;
const TOKEN = process.env.RUNTIME_TOKEN;

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
});

export async function dbQuery(sql, params = []) {
  const res = await fetch(`${BASE_URL}/db/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) throw new Error(`DB query failed: ${res.status}`);
  return res.json();
}

export async function dbExec(sql, params = []) {
  const res = await fetch(`${BASE_URL}/db/exec`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) throw new Error(`DB exec failed: ${res.status}`);
  return res.json();
}

export async function storageUpload(key, buffer, mimetype) {
  const form = new FormData();
  form.append('key', key);
  form.append('env', 'dev');
  form.append('file', new Blob([buffer], { type: mimetype }), key.split('/').pop());

  const res = await fetch(`${BASE_URL}/storage/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Storage upload failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function storageDownload(key) {
  const res = await fetch(`${BASE_URL}/storage/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) throw new Error(`Storage download failed: ${res.status}`);
  return res;
}

export async function initDb() {
  await dbExec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_version TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  const info = await dbQuery(`SELECT * FROM pragma_table_info('entries')`);
  if (!info.rows.some(r => r.name === 'image_key')) {
    await dbExec(`ALTER TABLE entries ADD COLUMN image_key TEXT`);
  }
}
