const express = require('express');
const router = express.Router();
const { User, Workspace } = require('../models/User.model');
const { authenticate } = require('../middleware/auth');
const notifService = require('../services/notification.service');

router.use(authenticate);

// GET /api/team — list members
router.get('/', async (req, res, next) => {
  try {
    const ws = await Workspace.findById(req.workspace._id)
      .populate('members.user', 'name email avatar lastLoginAt');
    res.json(ws.members);
  } catch (err) { next(err); }
});

// POST /api/team/invite — invite by email
router.post('/invite', async (req, res, next) => {
  try {
    const { email, role = 'editor' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await User.findOne({ email });
    if (!user) {
      // Create pending user
      user = await User.create({
        email,
        name: email.split('@')[0],
        password: Math.random().toString(36).slice(-12), // temp password
      });
    }

    // Check not already a member
    const ws = await Workspace.findById(req.workspace._id);
    const existing = ws.members.find(m => m.user.toString() === user._id.toString());
    if (existing) return res.status(409).json({ error: 'Already a member' });

    ws.members.push({ user: user._id, role });
    user.workspaces.addToSet(ws._id);
    await Promise.all([ws.save(), user.save()]);

    await notifService.create(null, {
      workspaceId: ws._id,
      userId: user._id,
      type: 'team_invite',
      title: 'You were added to a workspace',
      message: `You have been added to "${ws.name}" as ${role}.`,
      data: { workspaceId: ws._id, role },
    });

    res.status(201).json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role } });
  } catch (err) { next(err); }
});

// PATCH /api/team/:userId/role
router.patch('/:userId/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'editor', 'viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const ws = await Workspace.findById(req.workspace._id);
    const member = ws.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    member.role = role;
    await ws.save();
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/team/:userId
router.delete('/:userId', async (req, res, next) => {
  try {
    const ws = await Workspace.findById(req.workspace._id);
    if (ws.owner.toString() === req.params.userId) return res.status(403).json({ error: 'Cannot remove owner' });
    ws.members = ws.members.filter(m => m.user.toString() !== req.params.userId);
    await ws.save();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
