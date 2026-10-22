import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true },
  passCode: { type: String, default: null, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  purpose: { type: String, required: true },
  residentId: { type: String, required: true, index: true },
  apartmentId: { type: String, required: true },
  blockId: { type: String, required: true, index: true },
  vehicleNumber: { type: String, default: null },
  entryTime: { type: Date, default: null },
  exitTime: { type: Date, default: null },
  status: { type: String, enum: ['Pending', 'Approved', 'Inside', 'Exited', 'Rejected'], default: 'Pending' },
  approvedBy: { type: String, default: null },
}, { timestamps: true, versionKey: false });

schema.pre('save', function (next) {
  if (!this.passCode) {
    this.passCode = `GP-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

export default mongoose.model('Visitor', schema);
