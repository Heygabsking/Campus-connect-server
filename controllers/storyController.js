const Story = require('../models/Story');
const User = require('../models/User');
const { moderateContent } = require('../utils/moderation');
const { createNotification } = require('./notificationController');

// POST /api/stories
const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    const mediaUrl = req.file.path;
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

    // Content moderation
    let isFlagged = false;
    let flagReason = '';
    const modResult = moderateContent('', req.file.originalname);
    if (modResult.flagged) {
      isFlagged = true;
      flagReason = modResult.reason;
    }

    const story = await Story.create({
      user: req.user._id,
      mediaUrl,
      mediaType,
      isFlagged,
      flagReason
    });

    if (isFlagged) {
      // Notify all admins about flagged story
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          recipient: admin._id,
          sender: req.user._id,
          type: 'comment',
          commentText: `⚠️ FLAG ALERT: Story by @${req.user.username} was flagged. Reason: ${flagReason}`,
        });
      }
    }

    await story.populate('user', 'username profilePhoto');
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stories
const getStories = async (req, res) => {
  try {
    // Only return stories created in the last 24h that are not flagged
    const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({
      isFlagged: false,
      createdAt: { $gt: timeLimit }
    })
      .populate('user', 'username profilePhoto')
      .sort({ createdAt: 1 });

    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stories/:id/view
const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (!story.views.includes(req.user._id)) {
      story.views.push(req.user._id);
      await story.save();
    }
    res.json({ views: story.views.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stories/:id
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    // Owner or admin can delete
    if (story.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await story.deleteOne();
    res.json({ message: 'Story deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stories/:id/like
const likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    // Fallback if likes array doesn't exist
    if (!story.likes) {
      story.likes = [];
    }

    const isLiked = story.likes.includes(req.user._id);
    if (isLiked) {
      story.likes = story.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      story.likes.push(req.user._id);

      if (story.user.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: story.user,
          sender: req.user._id,
          type: 'like',
          post: null
        });
      }
    }

    await story.save();
    res.json({ liked: !isLiked, likes: story.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createStory,
  getStories,
  viewStory,
  deleteStory,
  likeStory
};
