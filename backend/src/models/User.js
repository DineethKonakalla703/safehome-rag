import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, required: true, enum: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT', 'TECHNICIAN', 'FACILITY_MANAGER', 'SECURITY'] },
  communityId: { type: String, required: true },
  blockId: { type: String, default: null },
  apartmentId: { type: String, default: null },
  technicianId: { type: String, default: null },
  phone: { type: String, default: '' },
  ownerOrTenant: { type: String, enum: ['Owner', 'Tenant', 'Staff', 'Not Applicable'], default: 'Not Applicable' },
  familyMembers: { type: Number, min: 0, default: 0 },
  emergencyContact: { type: String, default: '' },
  moveInDate: { type: Date, default: null },
  moveOutDate: { type: Date, default: null },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  activationStatus: { type: String, enum: ['PENDING','ACTIVE','DISABLED'], default: 'ACTIVE' },
  mustChangePassword: { type: Boolean, default: false },
  passwordResetTokenHash: { type: String, default: null, select: false },
  passwordResetExpiresAt: { type: Date, default: null, select: false },
  invitedAt: { type: Date, default: null },
  activatedAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) { return bcrypt.compare(candidate, this.password); };

export default mongoose.model('User', userSchema);
