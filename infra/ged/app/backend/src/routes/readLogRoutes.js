const { Router } = require('express');
const { confirmRead, getReadLog, myReadStatus } = require('../controllers/readLogController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.post('/',                          confirmRead);
router.get('/:documentId',                getReadLog);
router.get('/:documentId/my-status',      myReadStatus);

module.exports = router;
