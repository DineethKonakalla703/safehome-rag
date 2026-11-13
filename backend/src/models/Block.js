import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  blockId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  communityId: { type: String, required: true, index: true },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Block', schema);
