import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true }, title: { type: String, required: true }, category: { type: String, required: true }, blockId: { type: String, required: true, index: true }, communityId: { type: String, required: true, index: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' }, confidence: { type: Number, min: 0, max: 1, default: 0.75 }, status: { type: String, enum: ['Open', 'Monitoring', 'Resolved', 'DETECTED', 'MONITORING', 'ASSIGNED', 'RESOLVED', 'CLOSED', 'FALSE_POSITIVE'], default: 'DETECTED' }, relatedTickets: { type: [String], default: [] }, detectedBy: { type: String, default: 'hybrid-rules' }, aiReason: String, detectedAt: { type: Date, default: Date.now }, resolvedAt: { type: Date, default: null }, assignedTo: { type: String, default: null }, assignedToType: { type: String, enum: ['USER', 'TECHNICIAN', 'VENDOR', null], default: null }, affectedBlocks: { type: [String], default: [] }, affectedApartments: { type: [String], default: [] },
  comments: { type: [{ comment: { type: String, required: true }, createdBy: String, createdAt: { type: Date, default: Date.now } }], default: [] },
  timeline: { type: [{ action: String, details: String, performedBy: String, performedAt: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Incident', schema);
