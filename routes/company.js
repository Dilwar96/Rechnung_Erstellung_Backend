import express from 'express';
import * as companyController from '../controllers/companyController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All company routes require authentication
router.use(authMiddleware);

router.get('/', companyController.getCompany);
router.put('/', companyController.updateCompany);

export default router;