import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  amenityId: { type: String, required: true, unique: true }, name: { type: String, required: true }, location: { type: String, required: true },
  charge: { type: Number, min: 0, default: 0 }, availability: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Amenity', schema);
