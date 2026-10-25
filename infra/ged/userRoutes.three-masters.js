const { Router } = require('express');
const { list, options, getById, create, update, resetPassword, remove } = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../services/rbacService');
const { query } = require('../config/database');

const router = Router();
const APPROVED_UNIFIED_MASTERS = new Set(['user-ricardo', 'marcelo', 'alex']);

async function requireApprovedMaster(req, res, next) {
  if (req.user?.role !== 'ADMIN_MASTER')
    return res.status(403).json({ error: 'Sem acesso à gestão de usuários GED.' });
  try {
    const result = await query(
      'SELECT mapa_user_id FROM ged_identity_links WHERE ged_user_id = $1 AND active = TRUE',
      [req.user.id],
    );
    if (!result.rows.some(row => APPROVED_UNIFIED_MASTERS.has(row.mapa_user_id)))
      return res.status(403).json({ error: 'Sem acesso à gestão de usuários GED.' });
    next();
  } catch (error) {
    next(error);
  }
}

router.use(authenticate);
router.use(requireApprovedMaster);

router.get('/', requirePermission('users.read'), list);
router.get('/options', requirePermission('users.read'), options);
router.get('/:id', requirePermission('users.read'), getById);
router.post('/', requirePermission('users.create'), create);
router.put('/:id', requirePermission('users.edit'), update);
router.patch('/:id/password', requirePermission('users.reset_password'), resetPassword);
router.delete('/:id', requirePermission('users.deactivate'), remove);

module.exports = router;
