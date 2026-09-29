import { Router } from 'express';
import { createBill, listBills } from '../controllers/billController.js';
const router = Router();
router.get('/', listBills);
router.post('/', createBill);
export default router;

