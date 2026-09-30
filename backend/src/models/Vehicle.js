import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true }, residentId: { type: String, required: true, index: true }, apartmentId: { type: String, required: true }, blockId: { type: String, required: true, index: true },
  vehicleNumber: { type: String, required: true, unique: true, uppercase: true }, vehicleType: { type: String, enum: ['Car', 'Bike', 'Other'], default: 'Car' }, parkingSlotId: { type: String, default: null },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Vehicle', schema);
