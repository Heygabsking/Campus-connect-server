const Reel = require('../models/Reel');
const User = require('../models/User');
const { moderateContent } = require('../utils/moderation');
const { createNotification } = require('./notificationController');

// POST /api/reels
const createReel = async (req, res) => {
  try {
    const { caption } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required for reels' });
    }

    const videoUrl = req.file.path;

    // Content moderation check
    let isFlagged = false;
    let flagReason = '';
    const modResult = moderateContent(caption || '', req.file.originalname);
    if (modResult.flagged) {
      isFlagged = true;
      flagReason = modResult.reason;
    }

    const reel = await Reel.create({
      author: req.user._id,
      videoUrl,
      caption: caption || '',
      isFlagged,
      flagReason
    });

    if (isFlagged) {
      // Alert admins
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          recipient: admin._id,
          sender: req.user._id,
          type: 'comment',
          commentText: `⚠️ FLAG ALERT: Reel by @${req.user.username} was flagged. Reason: ${flagReason}`
        });
      }
    }

    await reel.populate('author', 'username profilePhoto');
    res.status(201).json(reel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reels
const getReels = async (req, res) => {
  try {
    const reels = await Reel.find({ isFlagged: false })
      .populate('author', 'username profilePhoto')
      .populate('comments.user', 'username profilePhoto')
      .sort({ createdAt: -1 });

    res.json(reels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/reels/:id/like
const likeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const alreadyLiked = reel.likes.includes(req.user._id);
    if (alreadyLiked) {
      reel.likes = reel.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      reel.likes.push(req.user._id);
      
      // Trigger notification
      await createNotification({
        recipient: reel.author,
        sender: req.user._id,
        type: 'like',
        commentText: `liked your reel`
      });
    }

    await reel.save();
    res.json({ likes: reel.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reels/:id/comment
const commentReel = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    reel.comments.push({ user: req.user._id, text });
    await reel.save();
    await reel.populate('comments.user', 'username profilePhoto');

    const newComment = reel.comments[reel.comments.length - 1];

    // Trigger notification
    await createNotification({
      recipient: reel.author,
      sender: req.user._id,
      type: 'comment',
      commentText: text
    });

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/reels/:id
const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    // Author or admin can delete
    if (reel.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    await reel.deleteOne();
    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReel,
  getReels,
  likeReel,
  commentReel,
  deleteReel
};
