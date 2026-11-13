import mongoose from 'mongoose';

// Domestic help and society staff with gate entry/exit history.
const entrySchema = new mongoose.Schema({ type: { type: String, enum: ['IN', 'OUT'], required: true }, at: { type: Date, default: Date.now }, by: String }, { _id: false });
const schema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  staffType: { type: String, required: true, enum: ['Maid', 'Cook', 'Driver', 'Nanny', 'Gardener', 'Car Cleaner', 'Society Staff', 'Security Guard', 'Electrician', 'Plumber', 'Other'], default: 'Maid' },
  employment: { type: String, enum: ['Private', 'Society'], default: 'Private' },
  residentId: { type: String, default: null, index: true },
  apartmentId: { type: String, default: null },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  workingDays: { type: String, default: 'Mon-Sat' },
  shift: { type: String, default: '07:00-11:00' },
  policeVerified: { type: Boolean, default: false },
  passCode: { type: String, index: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Blacklisted'], default: 'Active' },
  insideNow: { type: Boolean, default: false },
  lastEntryAt: { type: Date, default: null },
  lastExitAt: { type: Date, default: null },
  entryLog: { type: [entrySchema], default: [] },
  createdBy: String,
}, { timestamps: true, versionKey: false });
schema.pre('validate', function setPassCode() {
  if (!this.passCode) this.passCode = `ST${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
});
export default mongoose.model('StaffMember', schema);
