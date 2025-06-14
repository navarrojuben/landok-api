const express = require('express');
const router = express.Router();
const Food = require('../models/Food');

// CREATE
router.post('/', async (req, res) => {
  try {
    console.log('📥 POST /foods body:', req.body);

    const { name, price, category, description, available, image } = req.body;

    if (!name || !price || !category || !description || !image) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const food = new Food({
      name,
      price,
      category,
      description,
      available: available ?? true,
      image,
    });

    await food.save();
    res.status(201).json(food);
  } catch (err) {
    console.error('❌ Error saving food:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (err) {
    console.error('❌ Error fetching foods:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE (Full)
router.put('/:id', async (req, res) => {
  try {
    console.log('📤 PUT /foods/:id body:', req.body);
    const updated = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('❌ Error updating food:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH (Partial update - for toggling `hidden`, etc.)
router.patch('/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!food) return res.status(404).json({ error: 'Food not found' });
    res.json(food);
  } catch (err) {
    console.error('❌ PATCH error:', err);
    res.status(400).json({ error: 'Failed to update food' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: 'Food deleted' });
  } catch (err) {
    console.error('❌ Error deleting food:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
