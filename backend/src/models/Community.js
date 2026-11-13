import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  communityId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Community', schema);
