const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['https://landok.netlify.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

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

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('🚀 Chat server is running!');
});

// ✅ MongoDB Connection
console.log('🌐 Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 MongoDB connected'))
  .catch(err => console.error('🔴 MongoDB connection error:', err));

// ✅ Corrected Socket.IO Events
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  // ✅ Match frontend emit('sendMessage')
  socket.on('sendMessage', (message) => {
    console.log('📩 Received message:', message);

    // ✅ Broadcast to all clients
    io.emit('receiveMessage', message); // Match frontend socket.on('receiveMessage')
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
