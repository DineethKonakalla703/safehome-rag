import { Router } from 'express';
import multer from 'multer';
import { cancelImportJob, confirmImport, getImportJob, listImportJobs, previewImport } from '../controllers/importController.js';
import { authenticate, authorize } from '../middleware/auth.js';
const excelMime=new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','application/octet-stream']);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_EXCEL_UPLOAD_MB||5) * 1024 * 1024,files:1 }, fileFilter: (_req, file, cb) => {const valid=/\.(xlsx|xls)$/i.test(file.originalname)&&excelMime.has(file.mimetype);cb(valid?null:new Error('Only valid XLSX or XLS files are allowed.'),valid);} });
const router = Router(); router.use(authenticate, authorize('MAIN_ADMIN')); router.post('/preview-block-residents', upload.single('file'), previewImport); router.post('/confirm-block-residents', confirmImport);router.get('/jobs',listImportJobs);router.get('/jobs/:importId',getImportJob);router.post('/jobs/:importId/cancel',cancelImportJob); export default router;
