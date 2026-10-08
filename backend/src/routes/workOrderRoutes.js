import { Router } from 'express';
import { createWorkOrder, listWorkOrders, updateWorkOrderStatus, uploadWorkOrderCompletionImage } from '../controllers/workOrderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { imageUpload } from '../middleware/imageUpload.js';

const router = Router();
router.use(authenticate);
router.get('/', listWorkOrders);
router.post('/', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'), createWorkOrder);
router.patch('/:id/status', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'), updateWorkOrderStatus);
router.post('/:id/completion-image', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'), imageUpload.single('image'), uploadWorkOrderCompletionImage);

export default router;
