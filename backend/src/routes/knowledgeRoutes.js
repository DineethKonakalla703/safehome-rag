import { Router } from 'express';
import { createKnowledgeDocument, getKnowledgeDocument, listKnowledgeDocuments, queryKnowledge } from '../controllers/knowledgeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router(); router.use(authenticate);
router.post('/documents', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'), createKnowledgeDocument);
router.get('/documents', listKnowledgeDocuments); router.get('/documents/:documentId', getKnowledgeDocument); router.post('/query', queryKnowledge);
export default router;
