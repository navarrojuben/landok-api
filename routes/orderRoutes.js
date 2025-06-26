const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Food = require('../models/Food');
const { getIO } = require('../socket'); // ✅ Proper way to access io

const orderLimitMap = {};
const ORDER_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'landok123';

function cleanOldIPs() {
  const now = Date.now();
  for (const ip in orderLimitMap) {
    const recent = orderLimitMap[ip].filter(ts => now - ts < WINDOW_MS);
    if (recent.length === 0) {
      delete orderLimitMap[ip];
    } else {
      orderLimitMap[ip] = recent;
    }
  }
}

// 🔐 Check blocked IPs
router.get('/blocked-ips', (req, res) => {
  const token = req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  cleanOldIPs();

  const now = Date.now();
  const blocked = {};

  for (const ip in orderLimitMap) {
    const recent = orderLimitMap[ip].filter(ts => now - ts < WINDOW_MS);
    if (recent.length >= ORDER_LIMIT) {
      blocked[ip] = recent;
    }
  }

  res.json({ blocked });
});

// 🧾 Place a new order
router.post('/', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
    const now = Date.now();
    const timestamps = orderLimitMap[ip] || [];

    const recent = timestamps.filter(ts => now - ts < WINDOW_MS);
    if (recent.length >= ORDER_LIMIT) {
      return res.status(429).json({
        error: 'Too many orders from this IP. Please try again later.',
      });
    }

    orderLimitMap[ip] = [...recent, now];

    const { items, customerName, customerPhone, customerAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order.' });
    }

    let totalPrice = 0;
    const detailedItems = [];

    for (const item of items) {
      const food = await Food.findById(item.food);
      if (!food || !food.available || food.hidden) {
        return res.status(404).json({ error: `Food item not available: ${item.food}` });
      }

      totalPrice += food.price * item.quantity;

      detailedItems.push({
        food: food._id,
        foodId: food._id,
        quantity: item.quantity,
        name: food.name,
        price: food.price,
        image: food.image,
      });
    }

    const order = new Order({
      items: detailedItems,
      totalPrice,
      customerName,
      customerPhone,
      customerAddress,
    });

    const savedOrder = await order.save();

    for (const item of items) {
      await Food.findByIdAndUpdate(item.food, {
        $push: { orders: savedOrder._id },
      });
    }

    console.log(`✅ Order created from IP: ${ip}`);

    // ✅ Emit real-time event to all connected clients
    const io = getIO();
    io.emit('new-order', savedOrder);

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('❌ Order Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 📦 Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    res.status(500).json({ error: 'Server error while fetching orders.' });
  }
});

// 🔁 Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    console.log(`📦 Order ${req.params.id} updated to ${status}`);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error updating status:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// ❌ Delete order
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    console.log(`🗑 Order ${req.params.id} deleted`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order.' });
  }
});

// 📉 Decrement stock
router.put('/foods/:id/decrement-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const food = await Food.findById(id);
    if (!food) return res.status(404).json({ error: 'Food not found' });

    food.stock = Math.max(food.stock - quantity, 0);
    await food.save();

    console.log(`🔽 Decremented stock of ${food.name} (${id}) by ${quantity}`);
    res.json({ stock: food.stock });
  } catch (err) {
    console.error('❌ Error decrementing stock:', err);
    res.status(500).json({ error: 'Failed to decrement stock.' });
  }
});

module.exports = router;
