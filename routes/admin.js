import express from 'express';
import * as adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public route - no authentication required
router.post('/login', adminController.login);

// Protected route - requires authentication
router.post('/change-credentials', authMiddleware, adminController.changeCredentials);

export default router;