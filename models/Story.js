const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl:   { type: String, required: true },
  mediaType:  { type: String, enum: ['image', 'video'], required: true },
  views:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isFlagged:  { type: Boolean, default: false },
  flagReason: { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now, expires: 86400 } // 24 hours TTL
});

module.exports = mongoose.model('Story', storySchema);
