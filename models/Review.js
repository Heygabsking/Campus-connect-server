const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  lecturer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:     { type: Number, min: 1, max: 5, required: true },
  recommend:  { type: Boolean, default: true },
  comment:    { type: String, required: true },
  courseCode: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
