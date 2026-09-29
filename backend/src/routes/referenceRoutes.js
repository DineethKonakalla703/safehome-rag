import { Router } from 'express';
import { getReferenceData } from '../controllers/referenceController.js';
const router = Router();
router.get('/', getReferenceData);
export default router;

