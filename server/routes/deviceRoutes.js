const express = require('express');
const router = express.Router();
const deviceControllers = require('../controllers/deviceControllers');
const { verifyJWT } = require('../middlewares/middlewares');

router.get('/:deviceId/history', verifyJWT, deviceControllers.getDeviceHistory);
router.get('/', verifyJWT, deviceControllers.getDevice);
router.post('/', verifyJWT, deviceControllers.createDevice);

module.exports = router;