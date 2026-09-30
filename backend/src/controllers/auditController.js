import AuditLog from '../models/AuditLog.js';
import { asyncHandler, ok } from '../utils/http.js';
export const listAuditLogs = asyncHandler(async (req, res) => ok(res, await AuditLog.find().sort({ createdAt: -1 }).limit(500).lean()));
