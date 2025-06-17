// backend/socket.js
const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['https://landok.netlify.app', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      console.log(`🔐 ${socket.id} joined room: ${userId}`);
    });

    socket.on('sendMessage', (message) => {
      const { receiver } = message;
      io.to(receiver).emit('receiveMessage', message);
      console.log(`📨 Sent message to ${receiver}`);
    });

    socket.on('seenByAdmin', ({ user }) => {
      io.to(user).emit('seenByAdmin', { user });
      console.log(`👀 Sent seenByAdmin to ${user}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
