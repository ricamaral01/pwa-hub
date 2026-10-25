const { Router } = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sign } = require('../config/jwt');
const { getUserPermissions } = require('../services/rbacService');
const { verifyAssertion, gatewayPeer } = require('../middlewares/unifiedGateway');

const router = Router();
const MAPA_COOKIE = process.env.GED_UNIFIED_MAP_COOKIE || 'mapa_unificado_session';
const MAPA_CHECK_URL = process.env.GED_UNIFIED_MAP_CHECK_URL ||
  'https://concrefer.concretrack.com.br/unificado/mapa/api/unified/screen-access/me';
const DOWNLOAD_COOKIE = process.env.GED_DOWNLOAD_COOKIE || 'ged_download_session';

function mapaIdentity(cookieHeader) {
  const matches = String(cookieHeader || '').split(';').map(part => part.trim())
    .filter(part => part.startsWith(MAPA_COOKIE + '='));
  if (matches.length !== 1) return null;
  const cookie = matches[0];
  let claim;
  try {
    const encoded = decodeURIComponent(cookie.slice(MAPA_COOKIE.length + 1)).split('.')[0];
    claim = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch { return null; }
  if (claim?.scope !== 'session' || typeof claim.id !== 'string' ||
      !claim.id || typeof claim.updated_at !== 'string') return null;
  return { id:claim.id, cookie };
}

async function linkedUser(mapaId) {
  const result = await query(`SELECT u.id,u.name,u.email,u.username,u.role,u.managed_area,
    u.department_id,u.company_id,u.active,u.must_change_password,u.session_version,
    c.slug AS company_slug,c.primary_color FROM ged_identity_links l
    JOIN users u ON u.id=l.ged_user_id
    LEFT JOIN companies c ON c.id=u.company_id
    WHERE l.mapa_user_id=$1 AND l.active`, [mapaId]);
  const user = result.rows[0];
  // O login do Unificado já autenticou esta identidade. A obrigação de trocar
  // a senha antiga do GED continua valendo somente para o login direto.
  return user?.active ? user : null;
}

router.get('/authorize', async (req, res) => {
  if (!gatewayPeer(req)) return res.sendStatus(403);
  const identity = mapaIdentity(req.headers.cookie);
  if (!identity) return res.sendStatus(401);
  try {
    const check = await fetch(MAPA_CHECK_URL, {
      headers:{ Cookie:identity.cookie }, redirect:'manual', signal:AbortSignal.timeout(4000),
    });
    if (!check.ok) return res.sendStatus(check.status === 401 ? 401 : 403);
    const user = await linkedUser(identity.id);
    if (!user) return res.sendStatus(403);
    const payload = Buffer.from(JSON.stringify({iss:'unificado',aud:'ged',scope:'session',
      mapa_user_id:identity.id,ged_user_id:user.id,exp:Math.floor(Date.now()/1000)+20}))
      .toString('base64url');
    const signature = crypto.createHmac('sha256', process.env.GED_GATEWAY_SIGNING_KEY || '')
      .update(payload).digest('base64url');
    res.set('X-GED-Assertion', `${payload}.${signature}`);
    res.set('Cache-Control', 'no-store');
    return res.status(204).end();
  } catch { return res.sendStatus(503); }
});

router.get('/session', verifyAssertion, async (req, res) => {
  const claim = req.unifiedClaim;
  if (claim.scope !== 'session') return res.status(403).json({error:'Acesso negado.'});
  const user = await linkedUser(claim.mapa_user_id);
  if (!user || user.id !== claim.ged_user_id)
    return res.status(403).json({error:'Sem acesso ao GED.'});
  const token = sign({id:user.id,email:user.email,username:user.username,
    role:user.role,name:user.name,company_id:user.company_id,
    company_slug:user.company_slug,session_version:user.session_version,
    must_change_password:false,unified:true});
  const permissions = Array.from(await getUserPermissions(user.id));
  res.cookie(DOWNLOAD_COOKIE, token, {httpOnly:true,secure:true,
    sameSite:'lax',path:'/unificado/ged/uploads/',maxAge:8*60*60*1000});
  res.set('Cache-Control', 'no-store');
  res.json({token,user:{...user,must_change_password:false,permissions}});
});

module.exports = router;
