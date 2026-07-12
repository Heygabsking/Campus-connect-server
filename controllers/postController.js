const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// POST /api/posts
const createPost = async (req, res) => {
  try {
    const { content, category } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    // Only admins can post campus-updates
    if (category === 'campus-update' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can post campus updates' });

    const post = await Post.create({
      author: req.user._id,
      content,
      imageUrl: req.file?.path || '',
      category: category || 'general',
    });

    await post.populate('author', 'username profilePhoto');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/posts/feed  — posts from people you follow + campus updates
const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({
      $or: [
        { author: { $in: [...user.following, req.user._id] } },
        { category: 'campus-update' },
      ],
    })
      .populate('author', 'username profilePhoto role')
      .populate('comments.user', 'username profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/posts/campus-updates
const getCampusUpdates = async (req, res) => {
  try {
    const posts = await Post.find({ category: 'campus-update' })
      .populate('author', 'username profilePhoto')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/posts/user/:userId
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username profilePhoto')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
      await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: 'like',
        post: post._id
      });
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/posts/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate('comments.user', 'username profilePhoto');

    const newComment = post.comments[post.comments.length - 1];
    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      commentId: newComment._id,
      commentText: text
    });

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not allowed' });

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/posts/:id/flag  (admin only)
const flagPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isFlagged: true },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/posts/:id/comment/:commentId/like
const likeComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!comment.likes) {
      comment.likes = [];
    }

    const alreadyLiked = comment.likes.includes(req.user._id);
    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      comment.likes.push(req.user._id);
      
      await createNotification({
        recipient: comment.user,
        sender: req.user._id,
        type: 'comment-like',
        post: post._id,
        commentId: comment._id,
        commentText: comment.text
      });
    }

    await post.save();
    res.json({ likes: comment.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPost, getFeed, getCampusUpdates, getUserPosts, likePost, addComment, deletePost, flagPost, likeComment };
