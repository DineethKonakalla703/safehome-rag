import KnowledgeDocument from '../../models/KnowledgeDocument.js';
import { keywordSearch } from './vectorStore.js';

export async function retrieveKnowledge(question, limit = 6) {
  const chunks = await keywordSearch(question, limit);
  const ids = [...new Set(chunks.map((item) => item.documentId))];
  const documents = await KnowledgeDocument.find({ documentId: { $in: ids } }).lean();
  const documentMap = new Map(documents.map((item) => [item.documentId, item]));
  return chunks.map((chunk) => ({ ...chunk, document: documentMap.get(chunk.documentId) })).filter((item) => item.document);
}
