const express = require('express');
const router  = express.Router();
const { register, login, forgotPasswordVerify, forgotPasswordReset } = require('../controllers/authController');

router.post('/register',               register);
router.post('/login',                  login);
router.post('/forgot-password-verify', forgotPasswordVerify);
router.post('/forgot-password-reset',  forgotPasswordReset);

module.exports = router;
