import { Router } from 'express';
import { createWorkOrder, listWorkOrders, updateWorkOrderStatus } from '../controllers/workOrderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);
router.get('/', listWorkOrders);
router.post('/', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'), createWorkOrder);
router.patch('/:id/status', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'), updateWorkOrderStatus);
export default router;
