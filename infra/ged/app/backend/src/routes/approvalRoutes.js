const { Router } = require('express');
const { getPending, getAll, approve, reject } = require('../controllers/approvalController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/pending', getPending);
router.get('/',        getAll);
router.post('/:versionId/approve', approve);
router.post('/:versionId/reject',  reject);

module.exports = router;
