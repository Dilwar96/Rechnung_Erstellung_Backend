const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Public route - no authentication required
router.post('/login', adminController.login);

// Protected route - requires authentication
router.post('/change-credentials', authMiddleware, adminController.changeCredentials);

module.exports = router;