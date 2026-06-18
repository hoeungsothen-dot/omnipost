const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Metric = require('../../models/Metric.model');
const Content = require('../../models/Content.model');
const { Workspace } = require('../../models/User.model');
const logger = require('../../utils/logger');

// ─── Meta (Facebook + Instagram) Webhook ─────────────────────────────────
// Verification handshake
router.get('/meta', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    logger.info('Meta webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Receive events
router.post('/meta', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify signature
  const sig = req.headers['x-hub-signature-256'];
  const expected = `sha256=${crypto.createHmac('sha256', process.env.FACEBOOK_APP_SECRET).update(req.body).digest('hex')}`;
  if (sig !== expected) return res.sendStatus(401);

  const body = JSON.parse(req.body);
  res.sendStatus(200); // Respond fast, process async

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === 'feed' || change.field === 'media') {
        await processMetaInsight(change.value);
      }
    }
  }
});

async function processMetaInsight(value) {
  try {
    const { post_id, verb, item } = value;
    if (verb !== 'add' && verb !== 'edited') return;

    // Find content by platform post ID
    const content = await Content.findOne({ 'publishResults.platformPostId': post_id });
    if (!content) return;

    // Fetch fresh insights via API (webhook doesn't include metrics directly)
    logger.info(`Meta webhook: updating metrics for post ${post_id}`);
  } catch (err) {
    logger.error('Meta webhook processing error:', err);
  }
}

// ─── Analytics sync job (called by cron) ─────────────────────────────────
router.post('/sync-analytics', async (req, res, next) => {
  // This endpoint is called internally by the scheduler to pull fresh metrics
  try {
    const { workspaceId, platform, contentId } = req.body;
    const workspace = await Workspace.findById(workspaceId).select('+platforms.accessToken');
    const conn = workspace?.platforms.find(p => p.platform === platform && p.connected);
    if (!conn) return res.json({ skipped: true });

    const content = await Content.findById(contentId);
    const result = content?.publishResults?.find(r => r.platform === platform);
    if (!result?.platformPostId) return res.json({ skipped: true });

    let metrics = {};

    if (platform === 'facebook') {
      const axios = require('axios');
      try {
        const fields = 'post_impressions,post_impressions_unique,post_engaged_users,post_clicks';
        const r = await axios.get(`https://graph.facebook.com/v18.0/${result.platformPostId}/insights`, {
          params: { metric: fields, access_token: conn.accessToken },
        });
        const data = r.data.data || [];
        data.forEach(item => {
          if (item.name === 'post_impressions') metrics.impressions = item.values?.[0]?.value;
          if (item.name === 'post_impressions_unique') metrics.reach = item.values?.[0]?.value;
          if (item.name === 'post_engaged_users') metrics.engagement = item.values?.[0]?.value;
          if (item.name === 'post_clicks') metrics.clicks = item.values?.[0]?.value;
        });
      } catch (e) { logger.error('FB metrics fetch error:', e.message); }
    }

    if (platform === 'youtube') {
      const axios = require('axios');
      try {
        const r = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'statistics', id: result.platformPostId },
          headers: { Authorization: `Bearer ${conn.accessToken}` },
        });
        const stats = r.data.items?.[0]?.statistics || {};
        metrics = {
          views: parseInt(stats.viewCount || 0),
          likes: parseInt(stats.likeCount || 0),
          comments: parseInt(stats.commentCount || 0),
          reach: parseInt(stats.viewCount || 0),
        };
      } catch (e) { logger.error('YT metrics fetch error:', e.message); }
    }

    if (Object.keys(metrics).length) {
      await Metric.findOneAndUpdate(
        { workspaceId, platform, contentId, date: new Date(new Date().toDateString()) },
        { $set: { metrics } },
        { upsert: true, new: true }
      );
      await Content.findByIdAndUpdate(contentId, {
        'analytics.totalReach': metrics.reach || metrics.views || 0,
        'analytics.totalEngagements': metrics.engagement || metrics.likes || 0,
        'analytics.lastFetchedAt': new Date(),
      });
    }

    res.json({ success: true, metrics });
  } catch (err) { next(err); }
});

module.exports = router;
