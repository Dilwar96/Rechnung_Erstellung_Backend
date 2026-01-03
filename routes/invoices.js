const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');

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

// NOTE: PDF-per-email feature removed. If needed later, reintroduce with a
// dedicated service and configuration for SMTP and PDF generation.

module.exports = router; 