const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for videos
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/avi', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not allowed`));
  },
});

router.use(authenticate);

router.post('/', upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
    const results = await Promise.all(req.files.map(async (file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: isVideo ? 'video' : 'image',
            folder: `omnipost/${req.workspace._id}`,
            eager: isVideo ? [{ format: 'mp4', quality: 'auto' }] : [{ width: 1080, height: 1080, crop: 'limit', quality: 'auto' }],
            eager_async: true,
          },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(file.buffer);
      });
      return {
        url: result.secure_url,
        thumbnailUrl: isVideo ? result.eager?.[0]?.secure_url || result.secure_url : result.secure_url,
        type: isVideo ? 'video' : 'image',
        mimeType: file.mimetype,
        size: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        cloudinaryId: result.public_id,
      };
    }));
    res.json({ files: results });
  } catch (err) {
    logger.error('Upload error:', err);
    next(err);
  }
});

module.exports = router;
