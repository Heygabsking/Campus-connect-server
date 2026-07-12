require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Static folder for local uploads fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => res.send('CampusConnect API running ✅'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));

