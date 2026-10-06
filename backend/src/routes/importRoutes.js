import { Router } from 'express';
import multer from 'multer';
import { confirmImport, previewImport } from '../controllers/importController.js';
import { authenticate, authorize } from '../middleware/auth.js';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /\.(xlsx|xls)$/i.test(file.originalname)) });
const router = Router(); router.use(authenticate, authorize('MAIN_ADMIN')); router.post('/preview-block-residents', upload.single('file'), previewImport); router.post('/confirm-block-residents', confirmImport); export default router;
