const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Media = require('../models/Media.model');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 24, search } = req.query;
    const filter = { workspaceId: req.workspace._id };
    if (type) filter.type = type;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const [items, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Media.countDocuments(filter),
    ]);
    res.json({ items, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.post('/upload', upload.array('files', 20), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files provided' });

    const saved = await Promise.all(req.files.map(async (file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: isVideo ? 'video' : 'image',
            folder: `omnipost/${req.workspace._id}/library`,
            quality: 'auto',
            fetch_format: 'auto',
          },
          (err, result) => { if (err) reject(err); else resolve(result); }
        );
        stream.end(file.buffer);
      });

      return Media.create({
        workspaceId: req.workspace._id,
        uploadedBy: req.user._id,
        url: result.secure_url,
        thumbnailUrl: result.secure_url,
        type: isVideo ? 'video' : 'image',
        mimeType: file.mimetype,
        size: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        cloudinaryId: result.public_id,
        name: file.originalname,
      });
    }));

    res.status(201).json({ files: saved });
  } catch (err) {
    logger.error('Media upload error:', err);
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const media = await Media.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!media) return res.status(404).json({ error: 'Not found' });
    await cloudinary.uploader.destroy(media.cloudinaryId, {
      resource_type: media.type === 'video' ? 'video' : 'image',
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const media = await Media.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.workspace._id },
      { $set: { name: req.body.name, tags: req.body.tags } },
      { new: true }
    );
    res.json(media);
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Media.aggregate([
      { $match: { workspaceId: req.workspace._id } },
      { $group: { _id: '$type', count: { $sum: 1 }, totalSize: { $sum: '$size' } } },
    ]);
    res.json(stats);
  } catch (err) { next(err); }
});

module.exports = router;
