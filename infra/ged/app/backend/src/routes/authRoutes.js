const { Router } = require('express');
const { login, getMe, changePassword, logout } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
