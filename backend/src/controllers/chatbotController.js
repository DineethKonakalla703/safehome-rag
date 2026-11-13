import { processChatMessage } from '../ai/chatbot/chatbotController.js';
import { asyncHandler, ok, requireFields } from '../utils/http.js';
import { cancelConfirmation } from '../ai/chatbot/confirmationStore.js';
export const chatbotMessage = asyncHandler(async (req, res) => { requireFields(req.body, ['message']); const max = Number(process.env.CHATBOT_MAX_MESSAGE_LENGTH || 2000); if (String(req.body.message).length > max) throw new Error(`Chatbot messages cannot exceed ${max} characters.`); ok(res, await processChatMessage({ message: req.body.message, conversationId: req.body.conversationId, confirmationId: req.body.confirmationId, confirm: req.body.confirm === true, user: req.user })); });
export const cancelChatbotConfirmation=asyncHandler(async(req,res)=>ok(res,await cancelConfirmation({confirmationId:req.params.id,userId:req.user.userId})));
