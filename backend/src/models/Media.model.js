const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  url: { type: String, required: true },
  thumbnailUrl: String,
  type: { type: String, enum: ['image', 'video', 'gif', 'document'], required: true },
  mimeType: String,
  size: Number,
  width: Number,
  height: Number,
  duration: Number,
  cloudinaryId: { type: String, required: true },
  name: String,
  tags: [String],
  usedInContent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
}, { timestamps: true });

MediaSchema.index({ workspaceId: 1, type: 1, createdAt: -1 });
MediaSchema.index({ workspaceId: 1, tags: 1 });

module.exports = mongoose.model('Media', MediaSchema);
