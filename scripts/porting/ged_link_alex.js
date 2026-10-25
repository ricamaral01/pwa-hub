/* Create Alex's GED identity solely for unified SSO in the chosen environment.
 * Run inside the corresponding GED backend container after a database backup.
 * A random unknown password is stored; the direct GED login can be reset by an
 * administrator later. This script never prints secrets or tokens.
 */
const crypto = require('crypto');
const bcrypt = require('/app/node_modules/bcryptjs');
const {pool} = require('/app/src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      "SELECT u.id,u.role,u.active FROM ged_identity_links l JOIN users u ON u.id=l.ged_user_id WHERE l.mapa_user_id='alex' FOR UPDATE");
    if (existing.rows.length) {
      if (existing.rows[0].role !== 'ADMIN_MASTER' || !existing.rows[0].active) throw Error('Existing Alex GED link is not master');
      console.log(JSON.stringify({status:'already-linked',role:'ADMIN_MASTER'}));
      await client.query('COMMIT');
      return;
    }
    const collision = await client.query("SELECT id FROM users WHERE username='alex' OR email='alex@unificado.local.invalid'");
    if (collision.rows.length) throw Error('GED username/email collision; manual review required');
    const ricardo = await client.query("SELECT company_id FROM users WHERE username='ricardo' AND role='ADMIN_MASTER' AND active=true");
    if (ricardo.rows.length !== 1) throw Error('Ricardo GED account not found');
    const randomPassword = crypto.randomBytes(48).toString('base64url');
    const hash = await bcrypt.hash(randomPassword, 12);
    const created = await client.query(
      `INSERT INTO users(name,username,email,password_hash,role,active,must_change_password,company_id)
       VALUES($1,$2,$3,$4,'ADMIN_MASTER',true,true,$5) RETURNING id`,
      ['Alex Zaranello','alex','alex@unificado.local.invalid',hash,ricardo.rows[0].company_id]);
    await client.query(
      'INSERT INTO ged_identity_links(mapa_user_id,ged_user_id,active,approved_by) VALUES($1,$2,true,$3)',
      ['alex',created.rows[0].id,'user-ricardo']);
    await client.query('COMMIT');
    console.log(JSON.stringify({status:'created-and-linked',role:'ADMIN_MASTER'}));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    process.exitCode = 1;
  } finally { client.release(); await pool.end(); }
})();
