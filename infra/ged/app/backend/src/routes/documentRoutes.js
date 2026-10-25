const { Router } = require('express');
const {
  list, stats, statsByArea, getById, getVersions, create, uploadVersion, update, remove, publish, makeObsolete, expiring
} = require('../controllers/documentController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../services/rbacService');
const { issuePreviewLink } = require('../controllers/previewController');

const router = Router();

router.use(authenticate);

// Rotas estáticas primeiro para evitar conflito com :id
router.get('/stats', stats);
router.get('/stats/area', statsByArea);
router.get('/expiring', expiring);

// Rotas dinâmicas
router.get('/',      list);
router.get('/:id',          getById);
router.get('/:id/versions', getVersions);
router.get('/:id/versions/:versionId/preview-link', issuePreviewLink);

router.post(
  '/',
  requirePermission('documents.create'),
  create
);

router.post('/:id/upload', requirePermission('documents.upload'), uploadVersion);

router.put(
  '/:id',
  requirePermission('documents.edit_all'),
  update
);

router.delete(
  '/:id',
  requirePermission('documents.delete'),
  remove
);

router.post(
  '/:id/publish',
  requirePermission('documents.publish'),
  publish
);

router.post(
  '/:id/obsolete',
  requirePermission('documents.make_obsolete'),
  makeObsolete
);

module.exports = router;
