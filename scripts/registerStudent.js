const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  if (!process.env.MONGO_URI) {
    console.error('❌ Error: MONGO_URI is missing in .env');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // Check if user already exists
    const email = 'nancy.wanjiku@usiu.ac.ke';
    const username = 'nancy_wanjiku';
    const password = 'CampusConnect2026';

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log(`ℹ️ User @${username} or email ${email} already exists in database.`);
      process.exit(0);
    }

    console.log('🔄 Creating student account...');
    const user = await User.create({
      email,
      username,
      passwordHash: password, // Pre-save hook hashes this
      role: 'student',
      bio: 'USIU-Africa student.'
    });

    console.log('\n🎉 Student Account Created Directly!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Username: @${user.username}`);
    console.log(`🔑 Password: ${password}`);
  } catch (err) {
    console.error('❌ Error registering user:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

run();
