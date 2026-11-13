import mongoose from 'mongoose';

// Packages received at the gate, released to residents against a pickup code.
const schema = new mongoose.Schema({
  parcelId: { type: String, required: true, unique: true },
  residentId: { type: String, default: null, index: true },
  residentName: String,
  apartmentId: { type: String, required: true },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  courier: { type: String, default: 'Other' },
  description: { type: String, default: '' },
  trackingRef: { type: String, default: '' },
  packages: { type: Number, min: 1, default: 1 },
  storageLocation: { type: String, default: 'Security cabin' },
  pickupCode: { type: String, required: true },
  status: { type: String, enum: ['At Gate', 'Collected', 'Returned'], default: 'At Gate', index: true },
  receivedBy: String,
  receivedAt: { type: Date, default: Date.now },
  collectedAt: Date,
  collectedByName: String,
  releasedBy: String,
  remindersSent: { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Parcel', schema);
