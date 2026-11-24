const express = require('express');
const router = express.Router();
const {
  getInvoices,
  updateInvoiceStatus,
  askAiCopilot,
} = require('../controllers/invoiceController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/invoices', verifyToken, getInvoices);
router.patch('/invoices/:invoiceId/status', verifyToken, requireAdmin, updateInvoiceStatus);
router.post('/invoices/ai-query', verifyToken, requireAdmin, askAiCopilot);

module.exports = router;
