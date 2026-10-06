import mongoose from 'mongoose';
const schema = new mongoose.Schema({ chunkId: { type: String, required: true, unique: true }, documentId: { type: String, required: true, index: true }, content: { type: String, required: true }, embedding: { type: [Number], default: [] }, metadata: { type: mongoose.Schema.Types.Mixed, default: {} } }, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
export default mongoose.model('KnowledgeChunk', schema);
