const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  avatar: String,
  role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'editor' },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  lastLoginAt: Date,
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const PlatformConnectionSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  connected: { type: Boolean, default: false },
  accessToken: { type: String, select: false },
  refreshToken: { type: String, select: false },
  tokenExpiresAt: Date,
  accountId: String,
  accountName: String,
  accountAvatar: String,
  pageId: String,
  channelId: String,
  metadata: { type: Map, of: String },
}, { _id: false });

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: String,
  timezone: { type: String, default: 'UTC' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
    joinedAt: { type: Date, default: Date.now },
  }],
  platforms: [PlatformConnectionSchema],
  settings: {
    defaultPlatforms: [String],
    autoHashtags: { type: Boolean, default: true },
    aiCaptionsEnabled: { type: Boolean, default: true },
    analyticsRefreshInterval: { type: Number, default: 3600 }, // seconds
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    postsPerMonth: { type: Number, default: 30 },
    platformsAllowed: { type: Number, default: 3 },
  },
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Workspace: mongoose.model('Workspace', WorkspaceSchema),
};
