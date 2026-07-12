const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
  createPost, getFeed, getCampusUpdates,
  getUserPosts, likePost, addComment, deletePost, flagPost
} = require('../controllers/postController');

router.get('/feed',            protect, getFeed);
router.get('/campus-updates',  protect, getCampusUpdates);
router.get('/user/:userId',    protect, getUserPosts);
router.post('/',               protect, upload.single('image'), createPost);
router.put('/:id/like',        protect, likePost);
router.post('/:id/comment',    protect, addComment);
router.delete('/:id',          protect, deletePost);
router.put('/:id/flag',        protect, adminOnly, flagPost);

module.exports = router;
