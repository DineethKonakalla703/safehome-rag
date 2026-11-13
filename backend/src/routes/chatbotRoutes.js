import { Router } from 'express';
import { cancelChatbotConfirmation, chatbotMessage } from '../controllers/chatbotController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router(); router.use(authenticate); router.post('/message', chatbotMessage);router.post('/confirmation/:id/cancel',cancelChatbotConfirmation); export default router;
