import { Router } from 'express';
import { aiInsights, detectIncidents, getAIFeedbackAnalytics, getAIOverridesAnalytics, getAIUsageAnalytics, getTicketAIHistory, listIncidents, predictForTicket, recommendForTicket, recommendVendorsForTicket, reviewAIAnalysis } from '../controllers/aiController.js';
import { reanalyzeTicket } from '../controllers/ticketController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const managers = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'];

router.get('/insights', authorize(...managers), aiInsights);
router.get('/analytics', authorize(...managers), getAIFeedbackAnalytics);
router.get('/analytics/summary', authorize(...managers), getAIFeedbackAnalytics);
router.get('/analytics/usage', authorize(...managers), getAIUsageAnalytics);
router.get('/analytics/overrides', authorize(...managers), getAIOverridesAnalytics);
router.get('/incidents', authorize(...managers), listIncidents);
router.post('/recommend-technicians', authorize(...managers), recommendForTicket);
router.post('/recommend-vendors', authorize(...managers), recommendVendorsForTicket);
router.post('/predict-sla-risk', authorize(...managers), predictForTicket);
router.post('/detect-incidents', authorize(...managers), detectIncidents);
router.post('/tickets/:ticketId/reanalyze', authorize(...managers), reanalyzeTicket);
router.patch('/tickets/:ticketId/review', authorize(...managers), reviewAIAnalysis);
router.get('/tickets/:ticketId/history', authorize(...managers), getTicketAIHistory);

export default router;
