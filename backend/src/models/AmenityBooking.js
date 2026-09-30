import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true }, amenityId: { type: String, required: true, index: true }, residentId: { type: String, required: true, index: true }, blockId: { type: String, required: true, index: true },
  date: { type: Date, required: true }, timeSlot: { type: String, required: true }, status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' }, charge: { type: Number, min: 0, default: 0 },
}, { timestamps: true, versionKey: false });
schema.index({ amenityId: 1, date: 1, timeSlot: 1 }, { unique: true });
export default mongoose.model('AmenityBooking', schema);
