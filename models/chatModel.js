const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true,
  },
  receiver: {
    type: String,
    default: 'admin', // Default target is admin
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String, // Could be string or Date depending on frontend
    required: true,
  },
  seen: {
    type: Boolean,
    default: false, // Unseen by default
  },
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Chat', chatSchema);
