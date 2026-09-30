import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true }, title: { type: String, required: true }, type: { type: String, required: true }, fileUrl: { type: String, required: true },
  relatedEntityType: { type: String, required: true }, relatedEntityId: { type: String, required: true }, uploadedBy: { type: String, required: true }, blockId: { type: String, default: null },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Document', schema);
