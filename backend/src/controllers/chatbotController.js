import { processChatMessage } from '../ai/chatbot/chatbotController.js';
import { asyncHandler, ok, requireFields } from '../utils/http.js';
export const chatbotMessage = asyncHandler(async (req, res) => { requireFields(req.body, ['message']); ok(res, await processChatMessage({ message: req.body.message, conversationId: req.body.conversationId, confirm: req.body.confirm === true, user: req.user })); });
