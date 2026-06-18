// auth.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Workspace } = require('../models/User.model');
const { authenticate } = require('../middleware/auth');

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, workspaceName } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ email, password, name });
    const workspace = await Workspace.create({ name: workspaceName || `${name}'s Workspace`, owner: user._id, members: [{ user: user._id, role: 'admin' }] });
    user.workspaces.push(workspace._id);
    await user.save();
    const token = jwt.sign({ userId: user._id, workspaceId: workspace._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.status(201).json({ token, user: { _id: user._id, name, email }, workspace });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const workspace = await Workspace.findOne({ owner: user._id });
    const token = jwt.sign({ userId: user._id, workspaceId: workspace._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email }, workspace });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user, workspace: req.workspace }));

module.exports = router;
