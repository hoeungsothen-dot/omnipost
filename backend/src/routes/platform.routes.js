// platform.routes.js — Platform connection management
const express = require('express');
const router = express.Router();
const { Workspace } = require('../models/User.model');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const ws = await Workspace.findById(req.workspace._id).select('platforms');
  res.json(ws.platforms.map(p => ({ platform: p.platform, connected: p.connected, accountName: p.accountName, accountAvatar: p.accountAvatar, accountId: p.accountId })));
});

router.post('/:platform/connect', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { accessToken, refreshToken, accountId, accountName, accountAvatar, pageId, channelId, metadata } = req.body;
    const ws = await Workspace.findById(req.workspace._id);
    const existing = ws.platforms.find(p => p.platform === platform);
    const data = { platform, connected: true, accessToken, refreshToken, accountId, accountName, accountAvatar, pageId, channelId, metadata: metadata ? new Map(Object.entries(metadata)) : undefined };
    if (existing) { Object.assign(existing, data); } else { ws.platforms.push(data); }
    await ws.save();
    res.json({ success: true, platform, accountName });
  } catch (err) { next(err); }
});

router.delete('/:platform/disconnect', async (req, res, next) => {
  try {
    const ws = await Workspace.findById(req.workspace._id);
    const idx = ws.platforms.findIndex(p => p.platform === req.params.platform);
    if (idx !== -1) { ws.platforms[idx].connected = false; await ws.save(); }
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
