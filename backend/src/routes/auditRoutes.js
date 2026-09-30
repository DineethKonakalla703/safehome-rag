import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, authorize('MAIN_ADMIN'), listAuditLogs);
export default router;
