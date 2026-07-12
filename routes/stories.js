const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { createStory, getStories, viewStory } = require('../controllers/storyController');

router.post('/',        protect, upload.single('media'), createStory);
router.get('/',         protect, getStories);
router.put('/:id/view', protect, viewStory);

module.exports = router;
