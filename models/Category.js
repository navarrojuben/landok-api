// models/categoryModel.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, required: true }, // For custom ordering
});

module.exports = mongoose.model('Category', categorySchema);
