import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true }, name: { type: String, required: true }, phone: { type: String, required: true }, purpose: { type: String, required: true },
  residentId: { type: String, required: true, index: true }, apartmentId: { type: String, required: true }, blockId: { type: String, required: true, index: true },
  entryTime: { type: Date, default: Date.now }, exitTime: { type: Date, default: null }, status: { type: String, enum: ['Pending', 'Approved', 'Inside', 'Exited', 'Rejected'], default: 'Pending' }, approvedBy: { type: String, default: null },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Visitor', schema);
