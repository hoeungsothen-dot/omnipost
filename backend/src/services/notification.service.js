const Notification = require('../models/Notification.model');

async function create(io, { workspaceId, userId, type, title, message, data }) {
  const notif = await Notification.create({ workspaceId, userId, type, title, message, data });
  // Push real-time via Socket.IO
  if (io) {
    io.to(`workspace:${workspaceId}`).emit('notification:new', notif);
  }
  return notif;
}

async function notifyPublishResult(io, content, results) {
  const failures = results.filter(r => r.status === 'failed');
  const successes = results.filter(r => r.status === 'published');

  if (failures.length === 0) {
    await create(io, {
      workspaceId: content.workspaceId,
      type: 'publish_success',
      title: 'Published successfully',
      message: `"${content.title}" was published to ${successes.length} platform${successes.length !== 1 ? 's' : ''}.`,
      data: { contentId: content._id, platforms: successes.map(r => r.platform) },
    });
  } else if (successes.length === 0) {
    await create(io, {
      workspaceId: content.workspaceId,
      type: 'publish_failed',
      title: 'Publishing failed',
      message: `"${content.title}" failed to publish. ${failures.map(f => `${f.platform}: ${f.error}`).join('; ')}`,
      data: { contentId: content._id, errors: failures },
    });
  } else {
    await create(io, {
      workspaceId: content.workspaceId,
      type: 'publish_partial',
      title: 'Partially published',
      message: `"${content.title}" published to ${successes.length} platform(s) but failed on ${failures.map(f => f.platform).join(', ')}.`,
      data: { contentId: content._id, successes, failures },
    });
  }
}

module.exports = { create, notifyPublishResult };
