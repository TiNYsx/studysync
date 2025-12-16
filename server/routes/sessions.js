// ============================================
// routes/sessions.js - Study Session Routes
// ============================================
const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const { group, status } = req.query;
    let query = {};

    if (group) query.group = group;
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .populate('group', 'name')
      .populate('attendees', 'name email')
      .populate('creator', 'name email')
      .sort({ date: 1 });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create session
router.post('/', auth, async (req, res) => {
  try {
    const { group, topic, date, time, duration, location } = req.body;

    const session = new Session({
      group,
      creator: req.userId,
      topic,
      date,
      time,
      duration,
      location
    });

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('group', 'name')
      .populate('attendees', 'name email')
      .populate('creator', 'name email');

    res.status(201).json(populatedSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join session
router.post('/:id/join', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.attendees.includes(req.userId)) {
      return res.status(400).json({ error: 'Already joined' });
    }

    session.attendees.push(req.userId);
    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('group', 'name')
      .populate('attendees', 'name email');

    res.json(populatedSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete session (only by creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the creator can delete this session' });
    }

    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;