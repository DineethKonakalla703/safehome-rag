import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  technicianId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  skill: { type: String, required: true },
  available: { type: Boolean, default: true },
  communityId: { type: String, required: true, index: true },
  blockId: { type: String, default: null },
  rating: { type: Number, min: 0, max: 5, default: 4.5 },
  workload: { type: Number, min: 0, default: 0 },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Technician', schema);
