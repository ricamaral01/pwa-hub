const express = require('express');
const { config } = require('../core/config');
const { parseQuery } = require('../schemas/controle_estatistico');
const service = require('../services/controle_estatistico_service');

const router = express.Router();

router.get('/rompimentos-grupos', async (req, res, next) => {
  try {
    const filters = parseQuery(req.query, config);
    const response = await service.listRompimentosGrupos(filters, req.requestId);
    res.locals.source = response.source;
    res.locals.count = response.count;
    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = { router };
