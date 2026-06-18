const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric.model');
const Content = require('../models/Content.model');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/analytics/overview
router.get('/overview', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const workspaceId = req.workspace._id;

    const [metrics, contentStats] = await Promise.all([
      Metric.aggregate([
        { $match: { workspaceId, date: { $gte: since } } },
        { $group: {
          _id: '$platform',
          totalImpressions: { $sum: '$metrics.impressions' },
          totalReach: { $sum: '$metrics.reach' },
          totalEngagement: { $sum: '$metrics.engagement' },
          totalClicks: { $sum: '$metrics.clicks' },
          totalFollowersGained: { $sum: '$metrics.followersGained' },
        }},
      ]),
      Content.aggregate([
        { $match: { workspaceId, createdAt: { $gte: since } } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
        }},
      ]),
    ]);

    const totalReach = metrics.reduce((s, m) => s + m.totalReach, 0);
    const totalEngagement = metrics.reduce((s, m) => s + m.totalEngagement, 0);
    const totalImpressions = metrics.reduce((s, m) => s + m.totalImpressions, 0);

    res.json({
      summary: { totalReach, totalEngagement, totalImpressions, avgEngagementRate: totalReach ? ((totalEngagement / totalReach) * 100).toFixed(2) : 0 },
      byPlatform: metrics,
      contentByStatus: contentStats,
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/timeseries
router.get('/timeseries', async (req, res, next) => {
  try {
    const { platform, metric = 'reach', days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { workspaceId: req.workspace._id, date: { $gte: since } };
    if (platform) match.platform = platform;

    const data = await Metric.aggregate([
      { $match: match },
      { $group: {
        _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, platform: '$platform' },
        value: { $sum: `$metrics.${metric}` },
      }},
      { $sort: { '_id.date': 1 } },
    ]);

    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/analytics/top-content
router.get('/top-content', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const content = await Content.find({ workspaceId: req.workspace._id, status: 'published' })
      .sort({ 'analytics.totalEngagements': -1 })
      .limit(Number(limit))
      .lean();
    res.json(content);
  } catch (err) { next(err); }
});

// POST /api/analytics/ingest — receive analytics data from platform webhooks or manual sync
router.post('/ingest', async (req, res, next) => {
  try {
    const { platform, contentId, date, metrics } = req.body;
    await Metric.findOneAndUpdate(
      { workspaceId: req.workspace._id, platform, contentId, date: new Date(date) },
      { $set: { metrics } },
      { upsert: true, new: true }
    );
    // Update content aggregate
    if (contentId) {
      await Content.findByIdAndUpdate(contentId, {
        'analytics.totalReach': metrics.reach || 0,
        'analytics.totalEngagements': metrics.engagement || 0,
        'analytics.totalClicks': metrics.clicks || 0,
        'analytics.lastFetchedAt': new Date(),
      });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
