import mongoose from 'mongoose';
const schema = new mongoose.Schema({ notificationId: { type: String, required: true, unique: true }, userId: { type: String, default: null, index: true }, role: { type: String, default: null, index: true }, title: { type: String, required: true }, message: { type: String, required: true }, type: { type: String, default: 'INFO' }, entityType: String, entityId: String, read: { type: Boolean, default: false } }, { timestamps: true, versionKey: false });
export default mongoose.model('Notification', schema);
