const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function run() {
  console.log('🔄 Authenticating user nancy.wanjiku@usiu.ac.ke...');
  
  let token;
  try {
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'nancy.wanjiku@usiu.ac.ke',
      password: 'CampusConnect2026'
    });
    token = loginRes.data.token;
    console.log('✅ Authentication successful. Token obtained.');
  } catch (err) {
    console.error('❌ Authentication failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }

  // Create a dummy image file
  const dummyImagePath = path.join(__dirname, 'test-image.jpg');
  fs.writeFileSync(dummyImagePath, 'dummy-content-image-here');

  console.log('🔄 Submitting post with image...');
  const form = new FormData();
  form.append('content', 'This is a test post with an image uploaded directly!');
  form.append('category', 'general');
  form.append('image', fs.createReadStream(dummyImagePath));

  try {
    const res = await axios.post('http://localhost:5001/api/posts', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('🎉 Post Created Successfully!');
    console.log('📬 Response Data:', res.data);
  } catch (err) {
    console.error('❌ Post Creation Failed:', err.response ? err.response.data : err.message);
  } finally {
    // Clean up
    if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath);
    }
  }
}

run();
