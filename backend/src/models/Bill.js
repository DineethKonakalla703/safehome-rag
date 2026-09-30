import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  billId: { type: String, required: true, unique: true },
  ticketId: { type: String, required: true, unique: true, index: true },
  residentId: { type: String, required: true, index: true },
  apartmentId: { type: String, required: true },
  blockId: { type: String, required: true, index: true },
  communityId: { type: String, required: true, index: true },
  serviceCharge: { type: Number, required: true, min: 0 },
  partsCharge: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, required: true, enum: ['Pending', 'Paid', 'Failed', 'Cancelled'], default: 'Pending' },
  billType: { type: String, enum: ['Monthly', 'Repair'], default: 'Repair' },
  billingMonth: { type: String, default: null },
  dueDate: { type: Date, default: null },
  lateFee: { type: Number, min: 0, default: 0 },
  receiptNumber: { type: String, default: null },
  paymentMethod: { type: String, default: null },
  paidAt: { type: Date, default: null },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Bill', schema);
