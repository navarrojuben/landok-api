const express = require('express');
const router = express.Router();
const Food = require('../models/Food');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// 🌥️ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ CREATE FOOD
router.post('/', async (req, res) => {
  try {
    const { name, price, category, description, available, image, public_id, stock } = req.body;

    if (!name || !price || !category || !description || !image || !public_id || stock === undefined) {
      return res.status(400).json({ message: 'All fields including stock, image, and public_id are required.' });
    }

    const newFood = new Food({
      name,
      price,
      category,
      description,
      available: available ?? true,
      image,
      public_id,
      stock,
    });

    await newFood.save();
    res.status(201).json(newFood);
  } catch (err) {
    console.error('❌ Error saving food:', err);
    res.status(500).json({ message: 'Server error while saving food.' });
  }
});

// ✅ READ ALL FOODS
router.get('/', async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    console.error('❌ Error fetching foods:', err);
    res.status(500).json({ message: 'Server error while fetching foods.' });
  }
});

// ✅ UPDATE FOOD (Full PUT)
router.put('/:id', async (req, res) => {
  try {
    const foodId = req.params.id;
    const updatedFood = await Food.findByIdAndUpdate(foodId, req.body, { new: true });
    if (!updatedFood) return res.status(404).json({ message: 'Food not found' });

    res.json(updatedFood);
  } catch (err) {
    console.error('❌ Error updating food:', err);
    res.status(500).json({ message: 'Server error while updating food.' });
  }
});

// ✅ PATCH FOOD (e.g. toggle hidden, available, or stock)
router.patch('/:id', async (req, res) => {
  try {
    const foodId = req.params.id;
    const food = await Food.findByIdAndUpdate(foodId, req.body, { new: true });
    if (!food) return res.status(404).json({ message: 'Food not found' });

    res.json(food);
  } catch (err) {
    console.error('❌ Error patching food:', err);
    res.status(400).json({ message: 'Failed to patch food.' });
  }
});

// ✅ DELETE FOOD + CLOUDINARY IMAGE
router.delete('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const publicIdToDelete = req.query.public_id || food.public_id;

    console.log('🧾 Deleting Cloudinary image with public_id:', publicIdToDelete);

    if (publicIdToDelete) {
      const result = await cloudinary.uploader.destroy(publicIdToDelete);
      console.log('🛰️ Cloudinary response:', result);

      if (result.result !== 'ok' && result.result !== 'not found') {
        return res.status(500).json({ message: 'Cloudinary failed to delete image', result });
      }
    }

    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: '✅ Food and image deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting food:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /foods/:id/decrement-stock
router.put('/:id/decrement-stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const food = await Food.findById(id);
  if (!food) return res.status(404).send('Food not found');

  food.stock = Math.max(food.stock - quantity, 0);
  await food.save();
  res.json({ stock: food.stock });
});


module.exports = router;
