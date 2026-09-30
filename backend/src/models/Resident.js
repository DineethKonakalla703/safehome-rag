import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  residentId: { type: String, required: true, unique: true }, name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true }, phone: { type: String, default: '' },
  role: { type: String, enum: ['RESIDENT'], default: 'RESIDENT' }, apartmentId: { type: String, required: true }, blockId: { type: String, required: true, index: true }, communityId: { type: String, required: true },
  ownerOrTenant: { type: String, enum: ['Owner', 'Tenant'], default: 'Tenant' }, familyMembers: { type: Number, min: 0, default: 0 }, emergencyContact: { type: String, default: '' },
  moveInDate: { type: Date, default: null }, moveOutDate: { type: Date, default: null }, status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Resident', schema);
