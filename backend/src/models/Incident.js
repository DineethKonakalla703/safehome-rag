import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true }, title: { type: String, required: true }, category: { type: String, required: true }, blockId: { type: String, required: true, index: true }, communityId: { type: String, required: true, index: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' }, status: { type: String, enum: ['Open', 'Monitoring', 'Resolved'], default: 'Open' }, relatedTickets: { type: [String], default: [] }, detectedBy: { type: String, default: 'hybrid-rules' }, aiReason: String, detectedAt: { type: Date, default: Date.now }, resolvedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Incident', schema);
