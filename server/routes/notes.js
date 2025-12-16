// ============================================
// routes/notes.js - Notes Routes
// ============================================
const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all notes
router.get('/', async (req, res) => {
  try {
    const { group, search } = req.query;
    let query = {};

    if (group) query.group = group;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(query)
      .populate('author', 'name email')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'name email')
      .populate('group', 'name');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Increment views
    note.views += 1;
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create note
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, group, tags } = req.body;

    // Parse tags if it's sent as array
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = JSON.parse(tags);
    }

    const noteData = {
      title,
      content,
      author: req.userId,
      group,
      tags: parsedTags
    };

    const note = new Note(noteData);
    await note.save();

    // Award points to user
    await User.findByIdAndUpdate(req.userId, {
      $inc: { points: 10 }
    });

    const populatedNote = await Note.findById(note._id)
      .populate('author', 'name email')
      .populate('group', 'name');

    res.status(201).json(populatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    note.title = title || note.title;
    note.content = content || note.content;
    note.tags = tags || note.tags;
    note.updatedAt = Date.now();

    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('author', 'name email')
      .populate('group', 'name');

    res.json(populatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;