const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String, // URL
  category: String,
  available: Boolean
});

module.exports = mongoose.model('Food', foodSchema);
