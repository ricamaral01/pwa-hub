// Destination-only setup helper. Caller captures stdout; never log the JWT.
const { query, pool } = require('/app/src/config/database');
const { sign } = require('/app/src/config/jwt');

(async () => {
  const { rows } = await query(`SELECT id, session_version FROM users
    WHERE role = 'ADMIN_MASTER' AND active = TRUE AND must_change_password = FALSE
    ORDER BY username = 'ricardo' DESC LIMIT 1`);
  if (!rows.length) throw new Error('No available ADMIN_MASTER for synthetic setup');
  process.stdout.write(sign({ id: rows[0].id, session_version: rows[0].session_version }));
})().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
