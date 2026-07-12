const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already taken' });

    const user = await User.create({ email, username, passwordHash: password });

    res.status(201).json({
      _id: user._id, email: user.email, username: user.username,
      role: user.role, profilePhoto: user.profilePhoto,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (user.isSuspended)
      return res.status(403).json({ message: 'Your account has been suspended' });

    res.json({
      _id: user._id, email: user.email, username: user.username,
      role: user.role, profilePhoto: user.profilePhoto,
      bio: user.bio, token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login };
