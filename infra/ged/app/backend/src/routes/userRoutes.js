const { Router } = require('express');
const { list, options, getById, create, update, resetPassword, remove } = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../services/rbacService');

const router = Router();
const RICARDO_GED_USER_ID = 'f4ad0ccf-888e-4d14-aa7a-8b595bf9f459';

function requireRicardo(req, res, next) {
  if (req.user?.id !== RICARDO_GED_USER_ID)
    return res.status(403).json({ error: 'Sem acesso à gestão de usuários GED.' });
  next();
}

router.use(authenticate);
router.use(requireRicardo);

router.get('/', requirePermission('users.read'), list);
router.get('/options', requirePermission('users.read'), options);
router.get('/:id', requirePermission('users.read'), getById);
router.post('/', requirePermission('users.create'), create);
router.put('/:id', requirePermission('users.edit'), update);
router.patch('/:id/password', requirePermission('users.reset_password'), resetPassword);
router.delete('/:id', requirePermission('users.deactivate'), remove);

module.exports = router;
