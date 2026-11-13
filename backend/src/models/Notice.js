import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  noticeId: { type: String, required: true, unique: true }, title: { type: String, required: true }, message: { type: String, required: true },
  targetType: { type: String, enum: ['Community', 'Block'], default: 'Community' }, blockId: { type: String, default: null, index: true }, createdBy: { type: String, required: true },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Notice', schema);
