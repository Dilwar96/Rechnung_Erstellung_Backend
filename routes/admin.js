const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.login);
router.post('/change-credentials', adminController.changeCredentials);

module.exports = router;