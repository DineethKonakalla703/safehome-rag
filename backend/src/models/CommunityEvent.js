import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({ userId: { type: String, required: true }, name: String, response: { type: String, enum: ['Going', 'Maybe', 'Not Going'], required: true }, guests: { type: Number, min: 0, default: 0 }, at: { type: Date, default: Date.now } }, { _id: false });
const schema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['Festival', 'Meeting', 'AGM', 'Sports', 'Kids', 'Workshop', 'Health', 'Maintenance', 'Other'], default: 'Other' },
  startAt: { type: Date, required: true },
  endAt: { type: Date, default: null },
  location: { type: String, default: 'Clubhouse' },
  capacity: { type: Number, min: 0, default: 0 },
  targetType: { type: String, enum: ['Community', 'Block'], default: 'Community' },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  status: { type: String, enum: ['Scheduled', 'Cancelled', 'Completed'], default: 'Scheduled' },
  rsvps: { type: [rsvpSchema], default: [] },
  createdBy: String,
}, { timestamps: true, versionKey: false });
schema.index({ startAt: 1 });
export default mongoose.model('CommunityEvent', schema);
