import mongoose from 'mongoose';

// Preventive maintenance (PPM) schedules and AMC contracts for building assets.
export const ASSET_CATEGORIES = ['Lift', 'Generator', 'Water Pump', 'Fire Safety', 'STP / WTP', 'CCTV', 'Electrical', 'Plumbing', 'Gym Equipment', 'Swimming Pool', 'Pest Control', 'Other'];
export const FREQUENCIES = { Weekly: 7, Fortnightly: 14, Monthly: 30, Quarterly: 91, 'Half-Yearly': 182, Yearly: 365 };

const serviceSchema = new mongoose.Schema({ doneAt: { type: Date, default: Date.now }, by: String, byName: String, note: String, cost: { type: Number, default: 0 }, ledgerEntryId: String }, { _id: false });
const schema = new mongoose.Schema({
  scheduleId: { type: String, required: true, unique: true },
  assetName: { type: String, required: true, trim: true },
  category: { type: String, enum: ASSET_CATEGORIES, default: 'Other' },
  location: { type: String, default: '' },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  vendorId: { type: String, default: null },
  frequency: { type: String, enum: Object.keys(FREQUENCIES), default: 'Monthly' },
  lastDoneAt: { type: Date, default: null },
  nextDueAt: { type: Date, required: true, index: true },
  amcProvider: { type: String, default: '' },
  amcExpiry: { type: Date, default: null },
  amcCost: { type: Number, default: 0 },
  checklist: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Paused'], default: 'Active' },
  lastReminderFor: { type: Date, default: null },
  history: { type: [serviceSchema], default: [] },
  createdBy: String,
}, { timestamps: true, versionKey: false });
export default mongoose.model('MaintenanceSchedule', schema);
