const QUALITY_OPEN_URL = '/unificado/qualidade/abrir';

function rncMode(req, res) {
  res.json({ readonly: process.env.GED_RNC_READONLY === '1' });
}

function rncWriteGuard(req, res, next) {
  if (process.env.GED_RNC_READONLY === '1' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return res.status(410).json({
      error: 'RNC antiga somente para consulta. Abra novas NCs na Qualidade.',
      url: QUALITY_OPEN_URL,
    });
  }
  next();
}

module.exports = { rncMode, rncWriteGuard };
