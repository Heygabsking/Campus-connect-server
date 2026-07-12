const mongoose = require('mongoose');

const pastPaperSchema = new mongoose.Schema({
  lecturer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseCode: { type: String, required: true },
  fileUrl:    { type: String, required: true },
  fileName:   { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PastPaper', pastPaperSchema);
