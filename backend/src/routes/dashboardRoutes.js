import { Router } from 'express';
import { blockAdminDashboard, mainAdminDashboard, residentDashboard } from '../controllers/dashboardController.js';
const router = Router();
router.get('/main-admin', mainAdminDashboard);
router.get('/block-admin/:blockId', blockAdminDashboard);
router.get('/resident/:residentId', residentDashboard);
export default router;

