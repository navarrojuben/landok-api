const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/.test(v),
        message: 'Invalid image URL format.',
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    available: {
      type: Boolean,
      default: true,
    },

    // 👀 Used to toggle visibility to public
    hidden: {
      type: Boolean,
      default: false, // false = visible to public
    },

    // 🧑 Reference to the User who added this food (future feature)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // 📦 Future: Array of Order references that include this food
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Food', foodSchema);
