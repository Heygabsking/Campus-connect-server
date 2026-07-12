const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Seed default admin if none exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        email: 'admin@campusconnect.com',
        username: 'admin',
        passwordHash: 'admin123',
        role: 'admin',
        bio: 'CampusConnect System Administrator'
      });
      console.log('🛡️ Default admin account seeded: admin@campusconnect.com / admin123');
    }
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
