const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is missing');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'nancy.wanjiku@usiu.ac.ke';
    const password = 'CampusConnect2026';

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found in database');
      process.exit(1);
    }
    
    console.log('👤 User found:', user.username);
    console.log('🔑 Saved hash:', user.passwordHash);
    
    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      console.log('✅ Password matches! Database credentials are correct.');
    } else {
      console.log('❌ Password does not match saved hash.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

run();
