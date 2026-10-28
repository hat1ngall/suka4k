import pg from 'pg';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL || !process.argv[2]) {
  console.error('Usage: set DATABASE_URL and run node scripts/import-sites-users.mjs <path-to-private-export.json>'); process.exit(1);
}
const records = JSON.parse(await readFile(process.argv[2], 'utf8'));
if (!Array.isArray(records)) throw new Error('Expected an array of exported account rows.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
let added = 0, skipped = 0;
try {
  await client.query('BEGIN');
  for (const r of records) {
    if (typeof r.id !== 'string' || typeof r.email !== 'string' || !/^pbkdf2-sha256-chain6\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(r.password_hash) || !Number.isFinite(Number(r.created_at))) throw new Error('Invalid exported account record. Import cancelled.');
    const res = await client.query(`INSERT INTO users(id,email,password_hash,nickname,consent_at,created_at)
      VALUES($1,$2,$3,$4,CASE WHEN $5::double precision IS NULL THEN NULL ELSE to_timestamp($5::double precision) END,to_timestamp($6::double precision))
      ON CONFLICT (email) DO NOTHING`, [r.id, r.email, r.password_hash, r.nickname ?? null, r.consent_at ?? null, r.created_at]);
    if (res.rowCount) added++; else skipped++;
  }
  await client.query('COMMIT');
  console.log(`Imported ${added}; already-existing emails skipped: ${skipped}. Existing sessions were not imported.`);
} catch (error) { await client.query('ROLLBACK'); console.error('Import cancelled; no records imported:', error.message); process.exitCode = 1; }
finally { client.release(); await pool.end(); }
