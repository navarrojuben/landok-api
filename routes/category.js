// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories (ordered)
router.get('/', async (req, res) => {
  const categories = await Category.find().sort({ order: 1 });
  res.json(categories);
});

// Create new category
router.post('/', async (req, res) => {
  const { name, order } = req.body;
  const category = new Category({ name, order });
  await category.save();
  res.status(201).json(category);
});

// Update category order
router.put('/:id', async (req, res) => {
  const { order } = req.body;
  const category = await Category.findByIdAndUpdate(req.params.id, { order }, { new: true });
  res.json(category);
});

// Delete category
router.delete('/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

module.exports = router;
