import AIConversation from '../../models/AIConversation.js';
import { nextPublicId } from '../../utils/http.js';
import { writeAIAudit } from '../aiAuditLogger.js';
import { normalizeEntities } from './entityExtractor.js';
import { detectIntent } from './intentDetector.js';
import { canUseIntent, sensitiveIntent } from './permissionGuard.js';
import { routeTool } from './toolRouter.js';
import { consumeConfirmation, createConfirmation } from './confirmationStore.js';

export async function processChatMessage({ message, conversationId, confirmationId, confirm = false, user }) {
  let detected = await detectIntent(message, user.role); let entities = normalizeEntities(detected.intent, detected.entities, message);
  const id = conversationId || await nextPublicId(AIConversation, 'conversationId', 'CONV');
  let conversation = await AIConversation.findOne({ conversationId: id, userId: user.userId });
  if (!conversation) conversation = await AIConversation.create({ conversationId: id, userId: user.userId, role: user.role, title: message.slice(0, 80), messages: [] });
  conversation.messages.push({ role: 'user', content: message, intent: detected.intent });
  if (confirm) { const pending = await consumeConfirmation({ confirmationId, userId:user.userId, conversationId:id }); detected={...detected,intent:pending.intent,requiresConfirmation:true}; entities=pending.entities; }
  await writeAIAudit({ action: 'CHATBOT_INTENT_DETECTED', entityType: 'AIConversation', entityId: id, actorId: user.userId, message: `${detected.intent} detected.` });
  if (!canUseIntent(user.role, detected.intent)) {
    const response = 'This action is not permitted for your role.'; conversation.messages.push({ role: 'assistant', content: response, intent: detected.intent }); await conversation.save();
    await writeAIAudit({ action: 'CHATBOT_ACTION_DENIED', entityType: 'AIConversation', entityId: id, actorId: user.userId, message: `${user.role} denied ${detected.intent}.` });
    return { conversationId: id, intent: detected.intent, entities, requiresConfirmation: false, response, denied: true };
  }
  if ((detected.requiresConfirmation || sensitiveIntent(detected.intent)) && !confirm) {
    const pending=await createConfirmation({userId:user.userId,conversationId:id,intent:detected.intent,entities});
    const response = `${detected.response} Confirmation is required before any sensitive action.`; conversation.messages.push({ role: 'assistant', content: response, intent: detected.intent }); await conversation.save();
    await writeAIAudit({ action: 'CHATBOT_ACTION_REQUESTED', entityType: 'AIConversation', entityId: id, actorId: user.userId, message: `${detected.intent} awaiting confirmation.` });
    return { conversationId: id, confirmationId:pending.confirmationId, intent: detected.intent, entities, preview:{intent:detected.intent,entities,expiresAt:pending.expiresAt}, requiresConfirmation: true, response };
  }
  if (confirm) {
    await writeAIAudit({ action: 'CHATBOT_ACTION_CONFIRMED', entityType: 'AIConversation', entityId: id, actorId: user.userId, message: `${detected.intent} confirmed.` });
  }
  const data = await routeTool({ intent: detected.intent, entities, user });
  const response = data?.message || detected.response || 'Request completed within your authorized scope.'; conversation.messages.push({ role: 'assistant', content: response, intent: detected.intent }); await conversation.save();
  return { conversationId: id, intent: detected.intent, entities, requiresConfirmation: false, response, data };
}
