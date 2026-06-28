const express = require('express');
const router = express.Router();
const adminControllers = require('../controllers/adminControllers');
const { verifyJWT } = require('../middlewares/middlewares');

router.get('/userList',verifyJWT, adminControllers.userList)

module.exports = router;