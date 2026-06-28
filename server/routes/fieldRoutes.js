const express = require('express');
const router = express.Router();
const fieldControllers = require('../controllers/fieldControllers');
const { verifyJWT } = require('../middlewares/middlewares');

router.put('/:id', verifyJWT, fieldControllers.updateField);
router.delete('/:id', verifyJWT, fieldControllers.deleteField);
router.get('/', verifyJWT, fieldControllers.fields);
router.post('/', verifyJWT, fieldControllers.createField);

module.exports = router;