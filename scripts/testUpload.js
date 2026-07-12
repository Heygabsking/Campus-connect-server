const express = require('express');
const { upload } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const app = express();

app.post('/test-upload', upload.single('image'), (req, res) => {
  try {
    console.log('📂 req.file:', req.file);
    console.log('📝 req.body:', req.body);
    if (!req.file) {
      return res.status(400).json({ error: 'No file received' });
    }
    res.json({ success: true, file: req.file });
  } catch (err) {
    console.error('❌ Endpoint Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a dummy image file to test with
const dummyImagePath = path.join(__dirname, 'dummy.jpg');
fs.writeFileSync(dummyImagePath, 'fake-image-content');

// Start temporary test server
const server = app.listen(5002, async () => {
  console.log('🚀 Test server running on port 5002');
  
  // Make a request using standard fetch or axios if available
  const FormData = require('form-data');
  const axios = require('axios');
  
  const form = new FormData();
  form.append('content', 'Test content');
  form.append('image', fs.createReadStream(dummyImagePath));
  
  try {
    console.log('🔄 Sending test upload request...');
    const response = await axios.post('http://localhost:5002/test-upload', form, {
      headers: form.getHeaders()
    });
    console.log('✅ Upload Success Response:', response.data);
  } catch (err) {
    console.error('❌ Upload Request Failed:', err.response ? err.response.data : err.message);
  } finally {
    // Clean up
    server.close();
    if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath);
    }
    console.log('🧹 Cleaned up and shut down.');
  }
});
