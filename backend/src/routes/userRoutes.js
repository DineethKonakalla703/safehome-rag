import { Router } from 'express';
import { listDemoUsers, listUsers } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { resendInvite } from '../controllers/authController.js';
const router = Router();
router.get('/demo', listDemoUsers);
router.get('/', authenticate, authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'), listUsers);
router.post('/:id/resend-invite',authenticate,authorize('MAIN_ADMIN','BLOCK_SUB_ADMIN'),resendInvite);
export default router;
