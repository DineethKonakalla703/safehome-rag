import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({ role: { type: String, enum: ['user', 'assistant'], required: true }, content: { type: String, required: true }, intent: String, createdAt: { type: Date, default: Date.now } }, { _id: false });
const schema = new mongoose.Schema({ conversationId: { type: String, required: true, unique: true }, userId: { type: String, required: true, index: true }, role: { type: String, required: true }, title: { type: String, default: 'CRM assistant' }, messages: { type: [messageSchema], default: [] } }, { timestamps: true, versionKey: false });
export default mongoose.model('AIConversation', schema);
