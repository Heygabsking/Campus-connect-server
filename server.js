require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Allowed frontend websites
const allowedOrigins = [
  'http://localhost:3000',
  'https://campusconnectaapp.netlify.app',
];

// CORS configuration
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Allow JSON data
app.use(express.json());

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

// Test route
app.get('/', (req, res) => {
  res.send('CampusConnect API running ✅');
});

// Render automatically provides PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 CampusConnect server running on port ${PORT}`);
});