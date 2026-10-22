import { Router } from 'express';
import {
  createBill,
  createCheckoutOrder,
  generateMonthlyBills,
  getTaxInvoiceData,
  handlePaymentWebhook,
  listBills,
  residentBills,
  updateBillStatus,
  verifyCheckoutPayment,
} from '../controllers/billController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Webhook endpoint for live payment gateway notifications
router.post('/webhook', handlePaymentWebhook);

router.use(authenticate);
router.get('/', listBills);
router.get('/resident/:residentId', residentBills);
router.get('/:id/tax-invoice', getTaxInvoiceData);
router.post('/:id/create-order', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'), createCheckoutOrder);
router.post('/:id/verify-payment', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'), verifyCheckoutPayment);
router.post('/', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'), createBill);
router.post('/monthly-generate', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), generateMonthlyBills);
router.patch('/:id/status', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'), updateBillStatus);

export default router;
