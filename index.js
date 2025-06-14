const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// ✅ Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS setup
const allowedOrigins = ['https://landok.netlify.app', 'http://localhost:3000'];

app.use((req, res, next) => {
  console.log('🔥 Request Origin:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ✅ Routes
app.use('/upload',     require('./routes/upload'));
app.use('/foods',      require('./routes/food'));
app.use('/admin',      require('./routes/admin'));
app.use('/categories', require('./routes/category'));

// ✅ MongoDB connection (NO deprecated options)
console.log('🌐 Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 MongoDB connected'))
  .catch(err => console.error('🔴 MongoDB connection error:', err));

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
