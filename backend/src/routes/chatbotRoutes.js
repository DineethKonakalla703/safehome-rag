import { Router } from 'express';
import { chatbotMessage } from '../controllers/chatbotController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router(); router.use(authenticate); router.post('/message', chatbotMessage); export default router;
