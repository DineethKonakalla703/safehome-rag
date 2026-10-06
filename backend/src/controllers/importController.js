import { confirmBlockResidents, previewBlockResidents } from '../services/bulkImportService.js';
import { AppError, asyncHandler, created, ok, requireFields } from '../utils/http.js';
export const previewImport = asyncHandler(async (req, res) => { if (!req.file) throw new AppError(400, 'An Excel file is required.'); requireFields(req.body, ['blockName']); created(res, await previewBlockResidents({ buffer: req.file.buffer, blockName: req.body.blockName, user: req.user })); });
export const confirmImport = asyncHandler(async (req, res) => { requireFields(req.body, ['importId']); ok(res, await confirmBlockResidents({ importId: req.body.importId, confirm: req.body.confirm === true, user: req.user })); });
