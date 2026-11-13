import mongoose from 'mongoose';

// Society income & expense ledger. Resident maintenance/repair collections are read from Bills.
export const INCOME_CATEGORIES = ['Maintenance Collection', 'Amenity Income', 'Penalty / Late Fee', 'Interest', 'Other Income'];
export const EXPENSE_CATEGORIES = ['Electricity', 'Water', 'Security Salaries', 'Housekeeping', 'Staff Salaries', 'Repairs & Maintenance', 'Lift AMC', 'Generator / Diesel', 'Gardening', 'Pest Control', 'Insurance', 'Legal & Admin', 'Events', 'Other Expense'];
export const LEDGER_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const schema = new mongoose.Schema({
  entryId: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['Income', 'Expense'] },
  category: { type: String, required: true, enum: LEDGER_CATEGORIES },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, default: '' },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'], default: 'Bank Transfer' },
  vendorId: { type: String, default: null },
  reference: { type: String, default: '' },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  createdBy: String,
}, { timestamps: true, versionKey: false });
schema.index({ date: -1 });
export default mongoose.model('LedgerEntry', schema);
