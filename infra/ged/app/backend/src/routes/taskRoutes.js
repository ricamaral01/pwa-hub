const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const {
  listUsers,
  dashboard,
  list,
  getById,
  create,
  update,
  updateStatus,
  updateResponsible,
  updateDueDate,
  addComment,
  addParticipant,
  removeParticipant,
  linkDocument,
  unlinkDocument,
  uploadAttachment,
  cancel,
} = require('../controllers/taskController');

const router = Router();

router.use(authenticate);

router.get('/users/options', listUsers);
router.get('/dashboard', dashboard);
router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/status', updateStatus);
router.patch('/:id/responsible', updateResponsible);
router.patch('/:id/due-date', updateDueDate);
router.post('/:id/comments', addComment);
router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:userId', removeParticipant);
router.post('/:id/documents', linkDocument);
router.delete('/:id/documents/:documentId', unlinkDocument);
router.post('/:id/attachments', uploadAttachment);
router.post('/:id/cancel', cancel);

module.exports = router;
