function verificarToken(token) {
  if (!token || typeof token !== 'string' || token.length > 8192) return null;
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const anon = props.getProperty('SUPABASE_ANON_KEY');
  if (url && anon) {
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
    const cache = CacheService.getScriptCache();
    const cached = cache.get('auth:' + hash);
    if (cached) return JSON.parse(cached);
    try {
      const response = UrlFetchApp.fetch(url.replace(/\/$/, '') + '/auth/v1/user', { method: 'get', headers: { Authorization: 'Bearer ' + token, apikey: anon }, muteHttpExceptions: true });
      if (response.getResponseCode() === 200) {
        const body = JSON.parse(response.getContentText());
        if (body.email) { const u = { email: String(body.email).toLowerCase(), nome: body.user_metadata && (body.user_metadata.full_name || body.user_metadata.name) || body.email }; cache.put('auth:' + hash, JSON.stringify(u), 300); return u; }
      }
    } catch (_) {}
  }
  const secret = props.getProperty('JWT_SECRET');
  const audience = props.getProperty('JWT_AUDIENCE');
  if (!secret) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (header.alg !== 'HS256') return null;
    const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0] + '.' + parts[1], secret)).replace(/=+$/, '');
    if (expected !== parts[2]) return null;
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    if (!payload.exp || payload.exp <= Date.now() / 1000 || (audience && payload.aud !== audience)) return null;
    const email = payload.email || payload.sub;
    return email ? { email: String(email).toLowerCase(), nome: payload.name || email } : null;
  } catch (_) { return null; }
}

function lerUsuarios_() {
  const sh = aba_('usuarios', ['email', 'nome', 'papel', 'unidades', 'ativo']);
  return sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues().map(r => ({ email: String(r[0]).toLowerCase(), nome: String(r[1]), papel: String(r[2]), unidades: String(r[3]).split(',').map(s => s.trim()).filter(Boolean), ativo: r[4] === true || String(r[4]).toLowerCase() === 'true' }));
}
function perfilUsuario_(u) {
  const usuarios = lerUsuarios_();
  if (usuarios.length === 0 && u.email === String(PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '').toLowerCase()) {
    return { email: u.email, nome: u.nome, papel: 'admin', unidades: ['*'], ativo: true };
  }
  return usuarios.find(x => x.email === u.email) || null;
}
function salvarUsuario_(dados) {
  if (!dados.email || !['admin', 'engenheiro', 'laboratorio'].includes(dados.papel)) return falha_('VALIDACAO', 'Usuário inválido.');
  const sh = aba_('usuarios', ['email', 'nome', 'papel', 'unidades', 'ativo']);
  const email = String(dados.email).toLowerCase();
  const rows = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const index = rows.findIndex(r => String(r[0]).toLowerCase() === email);
  const row = [email, dados.nome || email, dados.papel, (dados.unidades || []).join(','), dados.ativo !== false];
  if (index >= 0) sh.getRange(index + 2, 1, 1, 5).setValues([row]); else sh.appendRow(row);
  return sucesso_({ id: email, versao: 1, revisao: 1 });
}
