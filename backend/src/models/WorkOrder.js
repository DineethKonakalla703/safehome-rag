import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  workOrderId: { type: String, required: true, unique: true }, ticketId: { type: String, required: true, index: true },
  technicianId: { type: String, required: true, index: true }, blockId: { type: String, required: true, index: true }, communityId: { type: String, required: true },
  title: { type: String, required: true }, description: { type: String, default: '' },
  status: { type: String, enum: ['Assigned', 'In Progress', 'Completed', 'Cancelled'], default: 'Assigned' },
  completionNote: { type: String, default: '' }, scheduledAt: { type: Date, default: null }, completedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });
export default mongoose.model('WorkOrder', schema);
