const express = require('express');
const Goal = require('../models/Goal');
const { auth } = require('./auth');

const router = express.Router();

// Get all goals for user
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new goal
router.post('/', auth, async (req, res) => {
    try {
        const goal = new Goal({
            ...req.body,
            user: req.user._id
        });
        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        res.status(400).json({ message: 'Invalid goal data' });
    }
});

// Update goal
router.put('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        );
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }
        res.json(goal);
    } catch (error) {
        res.status(400).json({ message: 'Update failed' });
    }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }
        res.json({ message: 'Goal deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

module.exports = router;
// goals.js route
