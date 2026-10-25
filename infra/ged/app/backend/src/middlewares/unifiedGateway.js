const crypto = require('crypto');

const MAX_ASSERTION_AGE_SECONDS = 20;

function gatewayPeer(req) {
  // Docker maps 127.0.0.1:13071 on the host to the bridge gateway visible here.
  // The published port is loopback-only; the Host check rejects requests routed
  // through the public vhost or made directly to the container by another app.
  const peer = String(req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const bridgeGateway = /^172\.(1[6-9]|2\d|3[01])\.\d+\.1$/.test(peer);
  return (peer === '127.0.0.1' || peer === '::1' || bridgeGateway) &&
    req.headers.host === (process.env.GED_GATEWAY_HOST || '127.0.0.1:13071') &&
    !req.headers['x-forwarded-for'];
}

function verifyAssertion(req, res, next) {
  const key = process.env.GED_GATEWAY_SIGNING_KEY;
  const assertion = req.get('X-GED-Assertion') || '';
  if (!gatewayPeer(req) || !key || Buffer.byteLength(key) < 32 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(assertion))
    return res.status(403).json({ error: 'Acesso negado.' });
  const [payload, signature] = assertion.split('.');
  const expected = crypto.createHmac('sha256', key).update(payload).digest();
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected))
    return res.status(403).json({ error: 'Acesso negado.' });
  let claim;
  try { claim = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); }
  catch { return res.status(403).json({ error: 'Acesso negado.' }); }
  const now = Math.floor(Date.now() / 1000);
  if (claim.iss !== 'unificado' || claim.aud !== 'ged' ||
      !Number.isInteger(claim.exp) || claim.exp < now ||
      claim.exp > now + MAX_ASSERTION_AGE_SECONDS ||
      typeof claim.ged_user_id !== 'string' || typeof claim.mapa_user_id !== 'string')
    return res.status(403).json({ error: 'Acesso negado.' });
  req.unifiedClaim = claim;
  next();
}

module.exports = { verifyAssertion, gatewayPeer };
