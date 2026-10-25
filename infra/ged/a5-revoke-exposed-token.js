const { query, pool } = require('/app/src/config/database');
(async () => {
  const result = await query(`UPDATE users SET session_version = session_version + 1
    WHERE username = 'e2e-ged-a5-admin-master' RETURNING id`);
  if (result.rowCount !== 1) throw new Error('Synthetic admin not found');
  process.stdout.write('synthetic session revoked\n');
})().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
