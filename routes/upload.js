require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Image = require('../models/Image'); // MongoDB model

const router = express.Router();

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Set up multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mern_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

/**
 * @route GET /upload
 * @desc Get all uploaded images
 */
router.get('/', async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /upload
 * @desc Upload an image to Cloudinary and save to MongoDB
 */
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    const newImage = new Image({
      url: req.file.path,               // Full Cloudinary URL
      public_id: req.file.filename,     // Cloudinary public ID (includes folder)
    });

    const savedImage = await newImage.save();
    res.json(savedImage);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @route DELETE /upload/:public_id
 * @desc Delete image from Cloudinary and MongoDB
 */
router.delete('/:public_id', async (req, res) => {
  let { public_id } = req.params;

  try {
    public_id = decodeURIComponent(public_id); // Handle slashes in ID
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok') {
      return res.status(400).json({ success: false, message: 'Failed to delete from Cloudinary' });
    }

    await Image.findOneAndDelete({ public_id });

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
