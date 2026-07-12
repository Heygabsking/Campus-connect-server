const readline = require('readline');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🛡️  CampusConnect Admin Creator');
  console.log('------------------------------');

  if (!process.env.MONGO_URI) {
    console.error('❌ Error: MONGO_URI is not defined in your server/.env file.');
    process.exit(1);
  }

  const email = await question('Enter admin email (e.g. admin@usiu.ac.ke): ');
  const username = await question('Enter admin username: ');
  const password = await question('Enter admin password: ');

  if (!email || !username || !password) {
    console.error('❌ Error: All fields are required!');
    rl.close();
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.error('❌ Error: A user with this email already exists.');
      mongoose.connection.close();
      rl.close();
      process.exit(1);
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.error('❌ Error: A user with this username already exists.');
      mongoose.connection.close();
      rl.close();
      process.exit(1);
    }

    console.log('🔄 Creating admin account...');
    const admin = await User.create({
      email,
      username,
      passwordHash: password,
      role: 'admin',
      bio: 'CampusConnect Admin Moderator'
    });

    console.log(`\n🎉 Success! Admin user @${admin.username} created successfully.`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Role: ${admin.role}`);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    mongoose.connection.close();
    rl.close();
  }
}

main();
