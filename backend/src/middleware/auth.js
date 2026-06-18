const jwt = require('jsonwebtoken');
const { User, Workspace } = require('../models/User.model');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const [user, workspace] = await Promise.all([
      User.findById(decoded.userId),
      Workspace.findById(decoded.workspaceId),
    ]);
    if (!user || !workspace) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    req.workspace = workspace;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticate };
