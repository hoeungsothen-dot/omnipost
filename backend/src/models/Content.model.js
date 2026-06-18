const mongoose = require('mongoose');

const PublishResultSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  status: { type: String, enum: ['pending', 'published', 'failed', 'skipped'], default: 'pending' },
  platformPostId: String,
  platformUrl: String,
  error: String,
  publishedAt: Date,
}, { _id: false });

const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'gif', 'document'], required: true },
  mimeType: String,
  size: Number,
  width: Number,
  height: Number,
  duration: Number,
  thumbnailUrl: String,
  cloudinaryId: String,
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'archived'],
    default: 'draft',
    index: true,
  },
  media: [MediaSchema],
  captions: {
    type: Map,
    of: String,
    default: {},
    // keys: facebook, youtube, instagram, tiktok, linkedin, telegram, website
  },
  hashtags: { type: Map, of: [String], default: {} },
  platforms: [{ type: String, enum: ['facebook', 'youtube', 'instagram', 'tiktok', 'linkedin', 'telegram', 'website'] }],
  scheduledAt: { type: Date, index: true },
  publishedAt: Date,
  publishResults: [PublishResultSchema],
  tags: [String],
  category: String,
  analytics: {
    totalReach: { type: Number, default: 0 },
    totalEngagements: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    lastFetchedAt: Date,
  },
  aiGenerated: { type: Boolean, default: false },
  notes: String,
}, { timestamps: true });

ContentSchema.index({ workspaceId: 1, status: 1, scheduledAt: 1 });
ContentSchema.index({ workspaceId: 1, createdAt: -1 });

module.exports = mongoose.model('Content', ContentSchema);
