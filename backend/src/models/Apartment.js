import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  apartmentId: { type: String, required: true, unique: true },
  number: { type: String, required: true },
  blockId: { type: String, required: true, index: true },
  communityId: { type: String, required: true, index: true },
  status: { type: String, default: 'Occupied', enum: ['Occupied', 'Vacant', 'Maintenance'] },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Apartment', schema);
