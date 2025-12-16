// ============================================
// models/User.js - User Model
// ============================================
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  studyGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  avatar: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);