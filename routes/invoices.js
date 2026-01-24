import express from 'express';
import * as invoicesController from '../controllers/invoicesController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All invoice routes require authentication
router.use(authMiddleware);

// Get all invoices
router.get('/', invoicesController.getAll);

// Get single invoice
router.get('/:id', invoicesController.getById);

// Create new invoice
router.post('/', invoicesController.create);

// Update invoice
router.put('/:id', invoicesController.update);

// Delete invoice
router.delete('/:id', invoicesController.remove);

export default router; 