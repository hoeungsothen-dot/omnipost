const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/captions', async (req, res, next) => {
  try {
    const { topic, tone, platforms, mediaDescription, language } = req.body;
    if (!topic || !platforms?.length) return res.status(400).json({ error: 'topic and platforms required' });
    const captions = await aiService.generateCaptions({
      topic, tone, platforms, mediaDescription, language,
      businessName: req.workspace.name,
    });
    res.json({ captions });
  } catch (err) { next(err); }
});

router.post('/hashtags', async (req, res, next) => {
  try {
    const { topic, platform, count } = req.body;
    const hashtags = await aiService.generateHashtags({ topic, platform, count });
    res.json({ hashtags });
  } catch (err) { next(err); }
});

router.post('/ideas', async (req, res, next) => {
  try {
    const { businessDescription, niche, platforms, count } = req.body;
    const ideas = await aiService.generateContentIdeas({ businessDescription, niche, platforms, count });
    res.json({ ideas });
  } catch (err) { next(err); }
});

router.post('/best-times', async (req, res, next) => {
  try {
    const { platform, audienceTimezone, industryNiche } = req.body;
    const result = await aiService.analyzeBestPostingTimes({ platform, audienceTimezone, industryNiche });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/chat', async (req, res, next) => {
  try {
    const { messages } = req.body;
    const reply = await aiService.chat({
      messages,
      workspaceContext: { name: req.workspace.name, platforms: req.workspace.platforms?.map(p => p.platform) },
    });
    res.json({ reply });
  } catch (err) { next(err); }
});

module.exports = router;
