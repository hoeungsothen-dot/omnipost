const express = require('express');
const router = express.Router();
const Content = require('../models/Content.model');
const { publishQueue } = require('../workers/scheduler.worker');
const { authenticate } = require('../middleware/auth');
const { z } = require('zod');

const ContentSchema = z.object({
  title: z.string().min(1).max(200),
  captions: z.record(z.string()).optional(),
  hashtags: z.record(z.array(z.string())).optional(),
  platforms: z.array(z.string()),
  scheduledAt: z.string().datetime().optional(),
  media: z.array(z.object({ url: z.string(), type: z.string() })).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

router.use(authenticate);

// GET /api/content — list content
router.get('/', async (req, res, next) => {
  try {
    const { status, platform, page = 1, limit = 20, search } = req.query;
    const filter = { workspaceId: req.workspace._id };
    if (status) filter.status = status;
    if (platform) filter.platforms = platform;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [items, total] = await Promise.all([
      Content.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Content.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/content/:id
router.get('/:id', async (req, res, next) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json(content);
  } catch (err) { next(err); }
});

// POST /api/content — create content
router.post('/', async (req, res, next) => {
  try {
    const data = ContentSchema.parse(req.body);
    const content = await Content.create({
      ...data,
      workspaceId: req.workspace._id,
      createdBy: req.user._id,
      captions: data.captions || {},
      hashtags: data.hashtags || {},
      status: data.scheduledAt ? 'scheduled' : 'draft',
    });

    // Queue immediately if publish now
    if (req.body.publishNow) {
      await publishQueue.add('publish-content', { contentId: content._id }, {
        attempts: 3, backoff: { type: 'exponential', delay: 5000 },
      });
      await Content.findByIdAndUpdate(content._id, { status: 'publishing' });
    }

    req.io?.to(`workspace:${req.workspace._id}`).emit('content:created', content);
    res.status(201).json(content);
  } catch (err) { next(err); }
});

// PATCH /api/content/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const content = await Content.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.workspace._id },
      { $set: req.body },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: 'Content not found' });
    req.io?.to(`workspace:${req.workspace._id}`).emit('content:updated', content);
    res.json(content);
  } catch (err) { next(err); }
});

// DELETE /api/content/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Content.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspace._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/content/:id/publish — publish immediately
router.post('/:id/publish', async (req, res, next) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    if (content.status === 'publishing') return res.status(409).json({ error: 'Already publishing' });

    await publishQueue.add('publish-content', { contentId: content._id }, {
      priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 5000 },
    });
    await Content.findByIdAndUpdate(content._id, { status: 'publishing' });
    req.io?.to(`workspace:${req.workspace._id}`).emit('content:publishing', { contentId: content._id });
    res.json({ success: true, message: 'Publishing queued' });
  } catch (err) { next(err); }
});

// GET /api/content/calendar — get calendar view
router.get('/view/calendar', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const filter = {
      workspaceId: req.workspace._id,
      scheduledAt: { $gte: new Date(start), $lte: new Date(end) },
    };
    const items = await Content.find(filter).sort({ scheduledAt: 1 }).lean();
    res.json(items);
  } catch (err) { next(err); }
});

module.exports = router;
