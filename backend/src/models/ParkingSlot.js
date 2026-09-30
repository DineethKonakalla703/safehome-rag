import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true }, blockId: { type: String, required: true, index: true }, slotNumber: { type: String, required: true },
  status: { type: String, enum: ['Available', 'Assigned', 'Maintenance'], default: 'Available' }, assignedTo: { type: String, default: null },
}, { timestamps: true, versionKey: false });
schema.index({ blockId: 1, slotNumber: 1 }, { unique: true });
export default mongoose.model('ParkingSlot', schema);
