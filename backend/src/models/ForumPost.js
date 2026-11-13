import mongoose from 'mongoose';

// Community discussion board + resident marketplace.
export const POST_KINDS = ['Discussion', 'Buy / Sell', 'Lost & Found', 'Recommendation', 'Help Needed', 'Announcement'];
const commentSchema = new mongoose.Schema({ commentId: String, authorId: String, authorName: String, authorRole: String, apartmentId: String, text: { type: String, required: true }, at: { type: Date, default: Date.now } }, { _id: false });
const schema = new mongoose.Schema({
  postId: { type: String, required: true, unique: true },
  kind: { type: String, enum: POST_KINDS, default: 'Discussion' },
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  price: { type: Number, default: null },
  condition: { type: String, enum: ['New', 'Like New', 'Good', 'Fair', null], default: null },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  authorId: { type: String, required: true, index: true },
  authorName: String,
  authorRole: String,
  apartmentId: String,
  blockId: { type: String, default: null },
  communityId: { type: String, default: null, index: true },
  pinned: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  likes: { type: [String], default: [] },
  comments: { type: [commentSchema], default: [] },
}, { timestamps: true, versionKey: false });
schema.index({ pinned: -1, createdAt: -1 });
export default mongoose.model('ForumPost', schema);
