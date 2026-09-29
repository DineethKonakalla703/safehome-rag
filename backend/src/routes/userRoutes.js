import { Router } from 'express';
import { listDemoUsers, listUsers } from '../controllers/userController.js';
const router = Router();
router.get('/demo', listDemoUsers);
router.get('/', listUsers);
export default router;

