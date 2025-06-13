const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();



// ✅ Fully open CORS (for development and deployment)
app.use(cors({
  origin: '*'
}));

app.use(express.json());

// ✅ Use project routes
app.use('/upload',       require('./routes/upload'));




// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 MongoDB connected'))
  .catch(err => console.error('🔴 MongoDB connection error:', err));

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
