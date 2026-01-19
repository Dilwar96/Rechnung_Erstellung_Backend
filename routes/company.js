const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/auth');

// All company routes require authentication
router.use(authMiddleware);

router.get('/', companyController.getCompany);
router.put('/', companyController.updateCompany);

module.exports = router;