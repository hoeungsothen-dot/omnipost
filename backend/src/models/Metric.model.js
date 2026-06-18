const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  date: { type: Date, required: true },
  metrics: {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 }, // seconds
    followers: { type: Number, default: 0 },
    followersGained: { type: Number, default: 0 },
  },
}, { timestamps: true });

MetricSchema.index({ workspaceId: 1, platform: 1, date: -1 });
MetricSchema.index({ contentId: 1, platform: 1 });

module.exports = mongoose.model('Metric', MetricSchema);
