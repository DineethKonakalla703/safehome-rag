import { Router } from 'express';
import { blockAdminDashboard, mainAdminDashboard, residentDashboard } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/main-admin', authenticate, authorize('MAIN_ADMIN'), mainAdminDashboard);
router.get('/block-admin/:blockId', authenticate, authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), blockAdminDashboard);
router.get('/resident/:residentId', authenticate, authorize('MAIN_ADMIN', 'RESIDENT'), residentDashboard);
export default router;
