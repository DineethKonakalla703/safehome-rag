import mongoose from 'mongoose';

// Stores the raw Claude message history (including tool_use / tool_result blocks) so a
// conversation can pause for the user's approval and resume exactly where it stopped.
const schema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, required: true },
  title: { type: String, default: 'AI copilot' },
  // Serialized JSON: tool inputs may contain keys MongoDB won't store (e.g. "$open").
  messagesJson: { type: String, default: '[]' },
  // UI transcript (what the user saw), kept separately from the model history.
  transcript: { type: [mongoose.Schema.Types.Mixed], default: [] },
  pendingJson: { type: String, default: null },
  usage: { inputTokens: { type: Number, default: 0 }, outputTokens: { type: Number, default: 0 }, cacheReadTokens: { type: Number, default: 0 } },
}, { timestamps: true, versionKey: false, minimize: false });
schema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('AgentSession', schema);
