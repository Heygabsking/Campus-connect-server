const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { createReel, getReels, likeReel, commentReel } = require('../controllers/reelController');

router.post('/',           protect, upload.single('video'), createReel);
router.get('/',            protect, getReels);
router.put('/:id/like',    protect, likeReel);
router.post('/:id/comment', protect, commentReel);

module.exports = router;
