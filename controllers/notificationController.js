const Notification = require('../models/Notification');

// Helper to create notifications
const createNotification = async ({ recipient, sender, type, post, commentId, commentText }) => {
  try {
    // Avoid sending notification to oneself
    if (recipient.toString() === sender.toString()) return null;

    // Optional: Avoid duplicate unread notifications of the same type by same sender for same post/comment
    const existing = await Notification.findOne({
      recipient,
      sender,
      type,
      post,
      commentId,
      isRead: false
    });
    if (existing) return existing;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      commentId,
      commentText
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username profilePhoto')
      .populate('post', 'content imageUrl')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/read
const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead
};
