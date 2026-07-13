const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { createLecturer, getLecturers, getLecturerDetails, addReview, uploadPastPaper, updateLecturer, deleteLecturer, editReview, deleteReview } = require('../controllers/lecturerController');

router.post('/',              protect, createLecturer);
router.get('/',               protect, getLecturers);
router.get('/:id',            protect, getLecturerDetails);
router.put('/:id',            protect, updateLecturer);
router.delete('/:id',         protect, deleteLecturer);
router.post('/:id/reviews',   protect, addReview);
router.post('/:id/papers',    protect, upload.single('paper'), uploadPastPaper);
router.put('/review/:reviewId',    protect, editReview);
router.delete('/review/:reviewId', protect, deleteReview);

module.exports = router;
