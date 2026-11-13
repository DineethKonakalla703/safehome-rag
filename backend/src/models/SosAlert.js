import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({ message: String, actor: String, at: { type: Date, default: Date.now } }, { _id: false });
const schema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  emergencyType: { type: String, required: true, enum: ['Medical', 'Fire', 'Gas Leak', 'Security Threat', 'Lift Stuck', 'Flooding', 'Electrical Hazard', 'Other'] },
  message: { type: String, default: '' },
  raisedBy: { type: String, required: true, index: true },
  raisedByName: String,
  raisedByRole: String,
  residentId: { type: String, default: null, index: true },
  apartmentId: { type: String, default: null },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  location: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Acknowledged', 'Resolved', 'False Alarm'], default: 'Active', index: true },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolvedBy: String,
  resolvedAt: Date,
  resolutionNote: String,
  timeline: { type: [stepSchema], default: [] },
}, { timestamps: true, versionKey: false });
export default mongoose.model('SosAlert', schema);
