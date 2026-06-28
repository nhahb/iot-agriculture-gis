const express = require('express')
const router = express.Router()
const authControllers = require('../controllers/authControllers')

router.post('/login', authControllers.login);
router.post('/logout', authControllers.logout);
router.post('/register', authControllers.register);
router.get('/refreshToken', authControllers.refreshToken);

module.exports = router;