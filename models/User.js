const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  username:     { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  bio:          { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  role:         { type: String, enum: ['student', 'admin'], default: 'student' },
  isSuspended:  { type: Boolean, default: false },
  followers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
