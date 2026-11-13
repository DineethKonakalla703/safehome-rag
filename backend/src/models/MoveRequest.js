import mongoose from 'mongoose';

// Move-in / move-out approval workflow (lift + gate booking, dues check on move-out).
const stepSchema = new mongoose.Schema({ message: String, actor: String, at: { type: Date, default: Date.now } }, { _id: false });
const schema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['Move-In', 'Move-Out'] },
  residentId: { type: String, required: true, index: true },
  residentName: String,
  apartmentId: { type: String, required: true },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  scheduledDate: { type: Date, required: true },
  timeSlot: { type: String, default: '09:00-13:00' },
  needsLift: { type: Boolean, default: true },
  vehicleNumber: { type: String, default: '' },
  moversCompany: { type: String, default: '' },
  notes: { type: String, default: '' },
  pendingDues: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'], default: 'Pending', index: true },
  decisionNote: { type: String, default: '' },
  decidedBy: String,
  decidedAt: Date,
  completedAt: Date,
  timeline: { type: [stepSchema], default: [] },
  createdBy: String,
}, { timestamps: true, versionKey: false });
export default mongoose.model('MoveRequest', schema);
