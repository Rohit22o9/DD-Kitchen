const express = require('express');
const router = express.Router();
const {
  getInvoices,
  updateInvoiceStatus,
  askAiCopilot,
} = require('../controllers/invoiceController');

router.get('/invoices', getInvoices);
router.patch('/invoices/:invoiceId/status', updateInvoiceStatus);
router.post('/invoices/ai-query', askAiCopilot);

module.exports = router;
