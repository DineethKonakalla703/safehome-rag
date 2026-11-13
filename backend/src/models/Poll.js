import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({ optionId: { type: String, required: true }, text: { type: String, required: true } }, { _id: false });
const voteSchema = new mongoose.Schema({ userId: { type: String, required: true }, apartmentId: String, optionId: { type: String, required: true }, at: { type: Date, default: Date.now } }, { _id: false });
const schema = new mongoose.Schema({
  pollId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  kind: { type: String, enum: ['Poll', 'Survey', 'Resolution'], default: 'Poll' },
  options: { type: [optionSchema], validate: [(v) => Array.isArray(v) && v.length >= 2, 'A poll needs at least two options.'] },
  votes: { type: [voteSchema], default: [] },
  onePerApartment: { type: Boolean, default: true },
  targetType: { type: String, enum: ['Community', 'Block'], default: 'Community' },
  blockId: { type: String, default: null, index: true },
  communityId: { type: String, default: null, index: true },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  closesAt: { type: Date, default: null },
  createdBy: String,
}, { timestamps: true, versionKey: false });
export default mongoose.model('Poll', schema);
