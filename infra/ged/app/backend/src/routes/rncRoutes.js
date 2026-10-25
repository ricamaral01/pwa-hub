const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { rncMode, rncWriteGuard } = require('../middlewares/rncReadonly');
const {
  list,
  getById,
  create,
  triage,
  updateStatus,
  upsertRootCause,
  addAction,
  updateAction,
  reviewEffectiveness,
  closeRnc,
  reopenRnc,
  addComment,
  uploadAttachment,
  listUsers,
} = require('../controllers/rncController');

const router = Router();

router.use(authenticate);

// C2 is armed only during the cutover. Read endpoints retain their existing RBAC.
router.get('/mode', rncMode);
router.use(rncWriteGuard);

router.get('/users/options', listUsers);
router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id/triage', triage);
router.patch('/:id/status', updateStatus);
router.put('/:id/root-cause', upsertRootCause);
router.post('/:id/actions', addAction);
router.patch('/:id/actions/:actionId', updateAction);
router.post('/:id/effectiveness', reviewEffectiveness);
router.post('/:id/close', closeRnc);
router.post('/:id/reopen', reopenRnc);
router.post('/:id/comments', addComment);
router.post('/:id/attachments', uploadAttachment);

module.exports = router;
