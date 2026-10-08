import mongoose from 'mongoose';

const completionImageSchema = new mongoose.Schema({
  fileName: { type: String, default: '' },
  originalName: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const schema = new mongoose.Schema({
  workOrderId: { type: String, required: true, unique: true },
  ticketId: { type: String, required: true, index: true },
  technicianId: { type: String, required: true, index: true },
  blockId: { type: String, required: true, index: true },
  communityId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Assigned', 'In Progress', 'Completed', 'Cancelled'], default: 'Assigned' },
  completionNote: { type: String, default: '' },
  completionImage: { type: completionImageSchema, default: null },
  scheduledAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

export default mongoose.model('WorkOrder', schema);
