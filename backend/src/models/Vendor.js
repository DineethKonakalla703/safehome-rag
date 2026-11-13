import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  vendorId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  communityId: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  hourlyRate: { type: Number, default: 500 },
  rating: { type: Number, min: 1, max: 5, default: 4.5 },
  completedJobsCount: { type: Number, min: 0, default: 0 },
  warrantyPeriodMonths: { type: Number, min: 0, default: 3 },
  emergencyAvailable: { type: Boolean, default: true },
  available: { type: Boolean, default: true },
  location: { type: String, default: 'City' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true, versionKey: false });

export default mongoose.model('Vendor', schema);
