const User = require('../models/User');
const Post = require('../models/Post');
const PDFDocument = require('pdfkit');
const { createNotification } = require('./notificationController');

// GET /api/users/:id
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { bio, username, removePhoto } = req.body;
    const user = await User.findById(req.user._id);

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    
    if (removePhoto === 'true' || removePhoto === true) {
      user.profilePhoto = '';
    } else if (req.file?.path) {
      user.profilePhoto = req.file.path;
    }

    await user.save();
    res.json({ _id: user._id, username: user.username, bio: user.bio, profilePhoto: user.profilePhoto });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id/follow
const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "You can't follow yourself" });

    const target = await User.findById(req.params.id);
    const me     = await User.findById(req.user._id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isFollowing = me.following.includes(target._id);
    if (isFollowing) {
      me.following = me.following.filter(id => id.toString() !== target._id.toString());
      target.followers = target.followers.filter(id => id.toString() !== me._id.toString());
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
      
      await createNotification({
        recipient: target._id,
        sender: me._id,
        type: 'follow'
      });
    }

    await me.save();
    await target.save();
    res.json({ following: !isFollowing, followerCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/search?q=username
const searchUsers = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);
    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    }).select('username profilePhoto bio').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id/report  — PDF download
const generateReport = async (req, res) => {
  try {
    const user  = await User.findById(req.params.id).select('-passwordHash');
    const posts = await Post.find({ author: req.params.id }).sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${user.username}-report.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).fillColor('#1F4E79').text('CampusConnect Activity Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#000').text(`Username: @${user.username}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Role: ${user.role}`);
    doc.text(`Followers: ${user.followers.length}  |  Following: ${user.following.length}`);
    doc.text(`Total Posts: ${posts.length}`);
    doc.moveDown();

    doc.fontSize(16).fillColor('#1F4E79').text('Posts', { underline: true });
    doc.moveDown(0.5);

    posts.forEach((post, i) => {
      doc.fontSize(11).fillColor('#333')
        .text(`${i + 1}. [${post.category.toUpperCase()}] ${new Date(post.createdAt).toLocaleDateString()}`, { continued: false });
      doc.fontSize(11).fillColor('#000').text(post.content);
      doc.text(`   ❤ ${post.likes.length} likes  |  💬 ${post.comments.length} comments`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/  (admin — all users)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id/suspend  (admin)
const suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: !req.body.suspend ? false : true },
      { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile, followUser, searchUsers, generateReport, getAllUsers, suspendUser };
