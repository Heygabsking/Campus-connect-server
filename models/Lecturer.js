const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  department: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Lecturer', lecturerSchema);
