import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  message: { type: String, required: true },
  actor: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const commentSchema = new mongoose.Schema({
  message: { type: String, required: true },
  actorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const attachmentSchema = new mongoose.Schema({
  attachmentId: { type: String, required: true }, fileName: { type: String, required: true }, originalName: { type: String, required: true }, mimeType: { type: String, required: true }, size: { type: Number, required: true }, storageType: { type: String, enum: ['local', 's3', 'cloudinary'], default: 'local' }, fileUrl: { type: String, required: true }, uploadedBy: { type: String, required: true }, uploadedAt: { type: Date, default: Date.now },
  aiImageAnalysis: { detectedIssue: String, visibleSafetyRisk: Boolean, riskType: { type: String, default: null }, observations: { type: [String], default: [] }, confidence: { type: Number, min: 0, max: 1 }, provider: String, modelVersion: String, fallbackUsed: Boolean, analyzedAt: Date },
}, { _id: false });

const schema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  residentId: { type: String, required: true, index: true },
  apartmentId: { type: String, required: true },
  blockId: { type: String, required: true, index: true },
  communityId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  severity: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
  safetyRisk: { type: Boolean, required: true },
  suggestedAction: { type: String, required: true },
  humanApprovalRequired: { type: Boolean, required: true },
  status: { type: String, required: true, enum: ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'], default: 'New', index: true },
  assignedTechnicianId: { type: String, default: null, index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  escalationFlag: { type: Boolean, default: false },
  slaDueDate: { type: Date, default: null },
  attachments: { type: [attachmentSchema], default: [] },
  comments: { type: [commentSchema], default: [] },
  timeline: { type: [timelineSchema], default: [] },
  aiAnalysis: {
    category: String, severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] }, safetyRisk: Boolean, safetyRiskType: { type: String, default: null }, missingInfo: { type: [String], default: [] }, suggestedAction: String,
    confidence: { type: Number, min: 0, max: 1 }, provider: String, modelVersion: String, fallbackUsed: Boolean, humanApprovalRequired: Boolean, reviewedByHuman: { type: Boolean, default: false }, reviewedBy: { type: String, default: null }, reviewedAt: { type: Date, default: null }, createdAt: Date,
  },
  slaPrediction: { riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] }, riskScore: { type: Number, min: 0, max: 1 }, reason: String, predictedAt: Date },
  recommendedTechnicians: { type: [{ technicianId: String, name: String, score: Number, reason: String, generatedAt: Date }], default: [] },
  relatedIncidentId: { type: String, default: null, index: true },
  aiReview: { originalAiAnalysis: mongoose.Schema.Types.Mixed, correctedCategory: String, correctedSeverity: String, correctedSafetyRisk: Boolean, overrideReason: String, reviewedBy: String, reviewedAt: Date, acceptedAiRecommendation: Boolean },
}, { timestamps: true, versionKey: false });

export default mongoose.model('Ticket', schema);
