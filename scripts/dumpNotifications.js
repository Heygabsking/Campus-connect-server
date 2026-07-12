const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
require('dotenv').config();

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not defined');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find().select('username role email');
    console.log('\n--- USERS ---');
    console.log(users);

    const notifications = await Notification.find()
      .populate('sender', 'username')
      .populate('recipient', 'username');
    console.log('\n--- NOTIFICATIONS ---');
    console.log(notifications);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

main();
