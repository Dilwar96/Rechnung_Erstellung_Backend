const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const authMiddleware = require('../middleware/auth');

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

module.exports = router; 