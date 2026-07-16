const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to generate a JSON Web Token (JWT) signed with the user ID
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Valid for 7 days

// POST /api/auth/register
// Registers a new student or admin account in the database
const register = async (req, res) => {
  try {
    const { email, username, password, role } = req.body;

    // Validation: make sure required fields are filled
    if (!email || !username || !password)
      return res.status(400).json({ message: 'All fields are required' });

    // Validation: check if email already exists
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    // Validation: check if username is already taken
    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already taken' });

    // Validation: enforce limit of maximum 3 admin accounts in the app
    if (role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 3) {
        return res.status(400).json({ message: 'Maximum limit of admin accounts (3) reached' });
      }
    }

    // Creates the user document in MongoDB (the password hash is processed automatically in User model pre-save hook)
    const user = await User.create({ email, username, passwordHash: password, role: role || 'student' });

    // Send back the user profile details and the generated security token
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
// Verifies user credentials and logs them in
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find the user by their email address
    const user = await User.findOne({ email });

    // Verifies password against database hash using compare helper inside User schema model
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Checks if the user profile has been suspended by an administrator
    if (user.isSuspended)
      return res.status(403).json({ message: 'Your account has been suspended' });

    // Send back credentials and new security token for the session
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
