import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true }, name: { type: String, required: true }, category: { type: String, required: true }, quantity: { type: Number, min: 0, default: 0 },
  minimumStock: { type: Number, min: 0, default: 0 }, unit: { type: String, required: true }, location: { type: String, required: true }, lastUpdatedBy: { type: String, required: true },
}, { timestamps: true, versionKey: false });
export default mongoose.model('InventoryItem', schema);
