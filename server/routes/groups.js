// ============================================
// routes/groups.js - Study Group Routes
// ============================================
const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's groups
router.get('/my-groups', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('creator', 'name email')
      .populate('members', 'name email');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create group
router.post('/', auth, async (req, res) => {
  try {
    const { name, subject, description } = req.body;

    const group = new Group({
      name,
      subject,
      description,
      creator: req.userId,
      members: [req.userId]
    });

    await group.save();

    // Add group to user's studyGroups
    await User.findByIdAndUpdate(req.userId, {
      $push: { studyGroups: group._id }
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populatedGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.members.includes(req.userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    group.members.push(req.userId);
    await group.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { studyGroups: group._id }
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    res.json(populatedGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update group progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { progress },
      { new: true }
    ).populate('creator', 'name email')
     .populate('members', 'name email');

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(req.userId)) {
      return res.status(400).json({ error: 'Not a member of this group' });
    }

    // Remove user from group members
    group.members = group.members.filter(member => member.toString() !== req.userId);
    await group.save();

    // Remove group from user's studyGroups
    await User.findByIdAndUpdate(req.userId, {
      $pull: { studyGroups: group._id }
    });

    res.json({ message: 'Successfully left the group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete group (only by creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the creator can delete this group' });
    }

    // Remove group from all members' studyGroups
    await User.updateMany(
      { studyGroups: group._id },
      { $pull: { studyGroups: group._id } }
    );

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;