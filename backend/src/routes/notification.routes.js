const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification.model');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 30, unreadOnly } = req.query;
    const filter = { workspaceId: req.workspace._id };
    if (unreadOnly === 'true') filter.read = false;
    const [items, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ workspaceId: req.workspace._id, read: false }),
    ]);
    res.json({ items, total, unread });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.workspace._id },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { workspaceId: req.workspace._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
