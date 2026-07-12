const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { findOrCreateChat, getChats, getMessages, sendMessage } = require('../controllers/chatController');

router.post('/find-or-create', protect, findOrCreateChat);
router.get('/',                protect, getChats);
router.get('/:chatId/messages', protect, getMessages);
router.post('/message',        protect, upload.single('media'), sendMessage);

module.exports = router;
