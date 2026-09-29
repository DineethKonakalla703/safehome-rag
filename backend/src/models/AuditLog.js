import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true, index: true },
  actorId: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
export default mongoose.model('AuditLog', schema);
