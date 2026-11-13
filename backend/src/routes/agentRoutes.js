import { Router } from 'express';
import { agentChat, agentSession, agentSessions, agentStatus, removeAgentSession } from '../controllers/agentController.js';
import { authenticate } from '../middleware/auth.js';
import { agentLimiter } from '../middleware/security.js';

const router = Router();
router.use(authenticate);
router.get('/status', agentStatus);
router.post('/chat', agentLimiter, agentChat);
router.get('/sessions', agentSessions);
router.get('/sessions/:id', agentSession);
router.delete('/sessions/:id', removeAgentSession);
export default router;
