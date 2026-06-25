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

export async function initDb() {
  await dbExec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_version TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
