require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Image = require('../models/Image'); // MongoDB model

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mern_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// GET /upload - fetch all uploaded images from MongoDB
router.get('/', async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 }); // newest first
    res.json(images);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST /upload - Upload image and save to MongoDB
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    console.log('Uploaded file:', req.file); // ✅ Debug log

    const newImage = new Image({
      url: req.file.path,               // full Cloudinary URL
      public_id: req.file.filename,     // includes folder (e.g., "mern_uploads/abc123")
    });

    const savedImage = await newImage.save();
    res.json(savedImage);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /upload/:public_id - Delete from Cloudinary & MongoDB
router.delete('/:public_id', async (req, res) => {
  let { public_id } = req.params;

  // Decode URL-encoded slashes if needed
  public_id = decodeURIComponent(public_id);

  try {
    // 1. Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok') {
      return res.status(400).json({ success: false, message: 'Failed to delete image from Cloudinary' });
    }

    // 2. Delete from MongoDB
    await Image.findOneAndDelete({ public_id });

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
