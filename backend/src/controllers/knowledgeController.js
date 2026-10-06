import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { ingestKnowledgeDocument } from '../ai/rag/knowledgeIngestion.js';
import { retrieveKnowledge } from '../ai/rag/retriever.js';
import { buildGraphContext } from '../ai/rag/graphContextBuilder.js';
import { generateGroundedAnswer } from '../ai/rag/answerGenerator.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';

export const createKnowledgeDocument = asyncHandler(async (req, res) => { requireFields(req.body, ['title', 'type', 'content']); const documentId = await nextPublicId(KnowledgeDocument, 'documentId', 'KDOC'); const record = await KnowledgeDocument.create({ documentId, title: req.body.title, type: req.body.type, category: req.body.category || 'General', content: req.body.content, fileUrl: req.body.fileUrl || '', relatedEntityType: req.body.relatedEntityType || null, relatedEntityId: req.body.relatedEntityId || null, uploadedBy: req.user.userId }); const chunks = await ingestKnowledgeDocument(record); await writeAIAudit({ action: 'KNOWLEDGE_DOCUMENT_INGESTED', entityType: 'KnowledgeDocument', entityId: documentId, actorId: req.user.userId, message: `${chunks.length} knowledge chunks created.` }); created(res, { ...record.toObject(), chunkCount: chunks.length }); });
export const listKnowledgeDocuments = asyncHandler(async (req, res) => ok(res, await KnowledgeDocument.find().select('-content').sort({ createdAt: -1 }).lean()));
export const getKnowledgeDocument = asyncHandler(async (req, res) => { const record = await KnowledgeDocument.findOne({ documentId: req.params.documentId }).lean(); if (!record) throw new AppError(404, 'Knowledge document not found.'); ok(res, record); });
export const queryKnowledge = asyncHandler(async (req, res) => { requireFields(req.body, ['question']); const retrieved = await retrieveKnowledge(req.body.question); const answer = await generateGroundedAnswer(req.body.question, retrieved, await buildGraphContext(req.user, { ticketId: req.body.ticketId })); await writeAIAudit({ action: 'KNOWLEDGE_QUERY_ANSWERED', entityType: 'KnowledgeQuery', entityId: req.body.ticketId || 'GENERAL', actorId: req.user.userId, message: `${answer.sources.length} sources used; confidence ${answer.confidence}.` }); ok(res, answer); });

export const reindexKnowledgeDocument = asyncHandler(async (req, res) => {
  const document = await KnowledgeDocument.findOne({ documentId: req.params.documentId });
  if (!document) throw new AppError(404, 'Knowledge document not found.');
  const chunks = await ingestKnowledgeDocument(document);
  await writeAIAudit({
    action: 'KNOWLEDGE_DOCUMENT_REINDEXED',
    entityType: 'KnowledgeDocument',
    entityId: document.documentId,
    actorId: req.user.userId,
    message: `${chunks.length} chunks re-indexed for ${document.documentId}.`,
  });
  ok(res, { success: true, documentId: document.documentId, chunkCount: chunks.length, status: 'INDEXED' });
});

export const getKnowledgeChunks = asyncHandler(async (req, res) => {
  const chunks = await KnowledgeChunk.find({ documentId: req.params.documentId }).sort({ chunkIndex: 1 }).lean();
  ok(res, chunks);
});
