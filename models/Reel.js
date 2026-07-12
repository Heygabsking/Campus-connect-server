const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true },
  likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const reelSchema = new mongoose.Schema({
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl:   { type: String, required: true },
  caption:    { type: String, default: '' },
  likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:   [commentSchema],
  isFlagged:  { type: Boolean, default: false },
  flagReason: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Reel', reelSchema);
