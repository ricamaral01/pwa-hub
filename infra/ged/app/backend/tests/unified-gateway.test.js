const assert = require('assert');
const crypto = require('crypto');
const { verifyAssertion } = require('../src/middlewares/unifiedGateway');

process.env.GED_GATEWAY_SIGNING_KEY = 'synthetic-ged-gateway-key-for-contract-test';

function signed(claim) {
  const payload = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const mac = crypto.createHmac('sha256', process.env.GED_GATEWAY_SIGNING_KEY)
    .update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

function check(assertion, {host='127.0.0.1:13071', peer='::ffff:172.18.0.1', forwarded}={}) {
  let status = 0, accepted = false;
  const req = {socket:{remoteAddress:peer},headers:{host,'x-forwarded-for':forwarded},
    get: () => assertion};
  const res = {status(value){status=value;return this;},json(){return this;}};
  verifyAssertion(req,res,()=>{accepted=true;});
  return {status,accepted,claim:req.unifiedClaim};
}

const now = Math.floor(Date.now()/1000);
const claim = {iss:'unificado',aud:'ged',scope:'session',mapa_user_id:'user-ricardo',
  ged_user_id:'f4ad0ccf-888e-4d14-aa7a-8b595bf9f459',exp:now+20};
assert.equal(check(signed(claim)).accepted,true);
assert.equal(check(signed(claim),{host:'concrefer.concretrack.com.br'}).status,403);
assert.equal(check(signed(claim),{peer:'198.51.100.1'}).status,403);
assert.equal(check(signed(claim),{forwarded:'198.51.100.1'}).status,403);
assert.equal(check(signed({...claim,exp:now-1})).status,403);
assert.equal(check(signed({...claim,aud:'other'})).status,403);
assert.equal(check(signed(claim).replace(/.$/,'A')).status,403);
console.log('GED gateway assertion: valid, expired, tampered and non-loopback gates passed');
