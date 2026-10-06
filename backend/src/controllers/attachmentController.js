import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ticket from '../models/Ticket.js';
import { scopedFilter } from '../middleware/auth.js';
import { ticketUploadDirectory, validImageSignature } from '../middleware/imageUpload.js';
import { callClaudeVisionJson } from '../ai/claudeClient.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';

const scope = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId', technicianField: 'assignedTechnicianId' });
const safeOriginalName = (name) => path.basename(name).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120);
export const uploadTicketAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'A supported image file is required.');
  const filePath = path.join(ticketUploadDirectory, req.file.filename); const header = Buffer.alloc(16); const handle = await fs.open(filePath, 'r'); await handle.read(header, 0, 16, 0); await handle.close();
  if (!validImageSignature(header, req.file.mimetype)) { await fs.unlink(filePath).catch(() => {}); throw new AppError(400, 'The uploaded file signature does not match its image type.'); }
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId, ...scope(req.user) });
  if (!ticket) { await fs.unlink(filePath).catch(() => {}); throw new AppError(404, 'Ticket not found in your access scope.'); }
  const attachment = { attachmentId: crypto.randomUUID(), fileName: req.file.filename, originalName: safeOriginalName(req.file.originalname), mimeType: req.file.mimetype, size: req.file.size, storageType: 'local', fileUrl: `/uploads/tickets/${req.file.filename}`, uploadedBy: req.user.userId, uploadedAt: new Date() };
  ticket.attachments.push(attachment); await ticket.save(); await writeAIAudit({ action: 'TICKET_IMAGE_UPLOADED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `Image ${attachment.attachmentId} uploaded securely.` }); created(res, attachment);
});
export const analyzeTicketImage = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId, ...scope(req.user) }); if (!ticket) throw new AppError(404, 'Ticket not found.');
  const attachment = ticket.attachments.find((item) => item.attachmentId === req.params.attachmentId); if (!attachment) throw new AppError(404, 'Attachment not found.');
  const fallback = { detectedIssue: 'Image uploaded, AI image analysis unavailable.', visibleSafetyRisk: false, riskType: null, observations: ['Image stored successfully; manual review required.'], confidence: 0, provider: 'unavailable', modelVersion: process.env.CLAUDE_MODEL || '', fallbackUsed: true };
  const data = await fs.readFile(path.join(ticketUploadDirectory, attachment.fileName));
  const result = await callClaudeVisionJson('You analyze residential maintenance images conservatively. Do not invent details. Identify visible hazards and return JSON only.', `Ticket: ${ticket.title}. Return detectedIssue, visibleSafetyRisk, riskType, observations array, and confidence from 0 to 1.`, data.toString('base64'), attachment.mimeType, fallback);
  const valid = result && typeof result.detectedIssue === 'string' && typeof result.visibleSafetyRisk === 'boolean' && Array.isArray(result.observations) && Number(result.confidence) >= 0 && Number(result.confidence) <= 1;
  attachment.aiImageAnalysis = { ...(valid ? result : fallback), confidence: Number(valid ? result.confidence : 0), provider: result === fallback ? fallback.provider : 'claude', modelVersion: process.env.CLAUDE_MODEL || '', fallbackUsed: result === fallback || !valid, analyzedAt: new Date() };
  if (attachment.aiImageAnalysis.visibleSafetyRisk) { ticket.safetyRisk = true; ticket.humanApprovalRequired = true; }
  await ticket.save(); await writeAIAudit({ action: attachment.aiImageAnalysis.fallbackUsed ? 'IMAGE_AI_ANALYSIS_FAILED' : 'IMAGE_AI_ANALYSIS_GENERATED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `Image analysis completed for ${attachment.attachmentId}; fallback ${attachment.aiImageAnalysis.fallbackUsed}.` }); ok(res, attachment.aiImageAnalysis);
});
