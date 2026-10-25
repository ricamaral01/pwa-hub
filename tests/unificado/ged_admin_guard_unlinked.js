/* Run in a GED backend container. Checks a real unlinked master stays denied. */
const {pool} = require('/app/src/config/database');
const {sign} = require('/app/src/config/jwt');

(async () => {
  try {
    const result = await pool.query(
      `SELECT u.id,u.session_version FROM users u
       WHERE u.role='ADMIN_MASTER' AND u.active
         AND NOT EXISTS (SELECT 1 FROM ged_identity_links l WHERE l.ged_user_id=u.id AND l.active)
       ORDER BY u.created_at LIMIT 1`);
    if (result.rows.length !== 1) throw Error('No unlinked master account available for denial test');
    const token = sign({id:result.rows[0].id,session_version:result.rows[0].session_version,unified:true});
    const response = await fetch('http://127.0.0.1:4000/api/users', {
      headers:{Authorization:'Bearer '+token},
    });
    if (response.status !== 403) throw Error('Unlinked GED master unexpectedly reached users endpoint: '+response.status);
    console.log(JSON.stringify({unlinked_ged_master_users_status:response.status}));
  } catch (error) { console.error(error.message); process.exitCode=1; }
  finally { await pool.end(); }
})();
