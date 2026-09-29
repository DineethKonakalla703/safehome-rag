import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, required: true, enum: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT', 'TECHNICIAN', 'FACILITY_MANAGER', 'SECURITY'] },
  communityId: { type: String, required: true },
  blockId: { type: String, default: null },
  apartmentId: { type: String, default: null },
  technicianId: { type: String, default: null },
}, { timestamps: true, versionKey: false });

export default mongoose.model('User', userSchema);

