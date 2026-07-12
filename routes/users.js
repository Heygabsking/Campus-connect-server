const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
  getProfile, updateProfile, followUser,
  searchUsers, generateReport, getAllUsers, suspendUser
} = require('../controllers/userController');

router.get('/search',          protect, searchUsers);
router.get('/all',             protect, adminOnly, getAllUsers);
router.get('/:id',             protect, getProfile);
router.put('/profile',         protect, upload.single('profilePhoto'), updateProfile);
router.put('/:id/follow',      protect, followUser);
router.get('/:id/report',      protect, generateReport);
router.put('/:id/suspend',     protect, adminOnly, suspendUser);

module.exports = router;
