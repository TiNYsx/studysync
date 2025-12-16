// ============================================
// routes/progress.js - Progress Routes
// ============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Note = require('../models/Note');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Get user progress
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('studyGroups');
    
    const notesCreated = await Note.countDocuments({ author: req.userId });
    const sessionsAttended = await Session.countDocuments({ 
      attendees: req.userId,
      status: 'completed'
    });

    const progress = {
      user: {
        id: user._id,
        name: user.name,
        points: user.points
      },
      stats: {
        groupsJoined: user.studyGroups.length,
        notesCreated,
        sessionsAttended
      },
      groups: user.studyGroups
    };

    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
