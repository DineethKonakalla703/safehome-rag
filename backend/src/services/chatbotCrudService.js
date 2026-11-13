import Block from '../models/Block.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { AppError, nextPublicId } from '../utils/http.js';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeBlockName = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /^block\b/i.test(trimmed) ? trimmed.replace(/^block\b/i, 'Block') : `Block ${trimmed}`;
};

export async function createBlockFromChat({ user, blockName }) {
  if (user.role !== 'MAIN_ADMIN') throw new AppError(403, 'Only Main Admin can create a block through the chatbot.');
  const name = normalizeBlockName(blockName);
  if (!name || name.length > 80) throw new AppError(400, 'A valid block name is required.');
  const existing = await Block.findOne({ communityId: user.communityId, name: new RegExp(`^${escapeRegExp(name)}$`, 'i') }).lean();
  if (existing) throw new AppError(409, `${existing.name} already exists.`);
  const blockId = await nextPublicId(Block, 'blockId', 'B');
  const block = await Block.create({ blockId, name, communityId: user.communityId });
  await writeAIAudit({ action: 'CHATBOT_BLOCK_CREATED', entityType: 'Block', entityId: blockId, actorId: user.userId, message: `${name} created through confirmed chatbot CRUD operation.` });
  return { executed: true, message: `${name} was created successfully with ID ${blockId}.`, block: block.toObject() };
}
