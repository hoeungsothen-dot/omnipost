const express = require('express');
const router = express.Router();
const Content = require('../models/Content.model');
const { publishQueue } = require('../workers/scheduler.worker');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/queue', async (req, res, next) => {
  try {
    const [waiting, active, delayed] = await Promise.all([
      publishQueue.getWaiting(),
      publishQueue.getActive(),
      publishQueue.getDelayed(),
    ]);
    res.json({ waiting: waiting.length, active: active.length, delayed: delayed.length });
  } catch (err) { next(err); }
});

router.post('/reschedule/:contentId', async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;
    const content = await Content.findOneAndUpdate(
      { _id: req.params.contentId, workspaceId: req.workspace._id },
      { scheduledAt: new Date(scheduledAt), status: 'scheduled' },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: 'Content not found' });
    // Remove old job if exists
    const job = await publishQueue.getJob(req.params.contentId);
    if (job) await job.remove();
    res.json(content);
  } catch (err) { next(err); }
});

module.exports = router;
