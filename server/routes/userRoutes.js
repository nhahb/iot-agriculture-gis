const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userControllers');
const { verifyJWT } = require('../middlewares/middlewares');

router.get('/account', verifyJWT, userControllers.account);
router.post('/account',verifyJWT, userControllers.updateAccount);

module.exports = router;