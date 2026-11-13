import { Router } from 'express';
import { getReferenceData } from '../controllers/referenceController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, getReferenceData);
export default router;
