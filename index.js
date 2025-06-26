const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { initSocket } = require('./socket'); // ✅ import socket init

dotenv.config();
const app = express();
const server = http.createServer(app);

// ✅ Initialize Socket.IO
initSocket(server); // ⬅️ sets up io and stores globally for reuse

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ['https://landok.netlify.app', 'http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ✅ Routes
app.use('/upload',     require('./routes/upload'));
app.use('/foods',      require('./routes/food'));
app.use('/admin',      require('./routes/admin'));
app.use('/categories', require('./routes/category'));
app.use('/chat',       require('./routes/chatRoutes'));
app.use('/orders',     require('./routes/orderRoutes')); // ✅ orders use getIO inside

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('🚀 Chat server is running!');
});

// ✅ MongoDB Connection
console.log('🌐 Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 MongoDB connected'))
  .catch(err => console.error('🔴 MongoDB connection error:', err));

// ✅ Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
