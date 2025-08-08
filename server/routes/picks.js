const express = require('express');
const { body, validationResult } = require('express-validator');
const Pick = require('../models/Pick');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/picks
// @desc    Submit picks for an event
// @access  Private
router.post('/', auth, [
  body('eventId')
    .isInt({ min: 1 })
    .withMessage('Valid event ID is required'),
  body('picks')
    .isArray({ min: 1 })
    .withMessage('At least one pick is required'),
  body('picks.*.fightNumber')
    .isInt({ min: 1 })
    .withMessage('Valid fight number is required'),
  body('picks.*.winner')
    .isIn(['fighter1', 'fighter2'])
    .withMessage('Winner must be fighter1 or fighter2'),
  body('picks.*.method')
    .isIn(['KO/TKO', 'Submission', 'Decision'])
    .withMessage('Method must be KO/TKO, Submission, or Decision'),
  body('picks.*.round')
    .isInt({ min: 1, max: 5 })
    .withMessage('Round must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { eventId, picks } = req.body;

    // Check if event exists and is upcoming
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'upcoming') {
      return res.status(400).json({ message: 'Picks can only be submitted for upcoming events' });
    }

    // Check if pick deadline has passed
    if (new Date() > event.pickDeadline) {
      return res.status(400).json({ message: 'Pick deadline has passed' });
    }

    // Check if user already submitted picks for this event
    const existingPick = await Pick.findOne({ 
      where: { user_id: req.user.id, event_id: eventId } 
    });
    if (existingPick && existingPick.isSubmitted) {
      return res.status(400).json({ message: 'Picks already submitted for this event' });
    }

    // Validate that all fight numbers exist in the event
    const eventFightNumbers = event.fights.map(f => f.fightNumber);
    const pickFightNumbers = picks.map(p => p.fightNumber);
    
    const invalidFights = pickFightNumbers.filter(fn => !eventFightNumbers.includes(fn));
    if (invalidFights.length > 0) {
      return res.status(400).json({ 
        message: `Invalid fight numbers: ${invalidFights.join(', ')}` 
      });
    }

    // Create or update picks
    let userPick;
    if (existingPick) {
      userPick = existingPick;
      userPick.picks = picks;
      await userPick.save();
    } else {
      userPick = await Pick.create({
        user_id: req.user.id,
        event_id: eventId,
        picks
      });
    }

    // Submit picks
    userPick.isSubmitted = true;
    await userPick.save();

    res.status(201).json({
      message: 'Picks submitted successfully',
      pick: userPick
    });
  } catch (error) {
    console.error('Submit picks error:', error);
    res.status(500).json({ message: 'Server error submitting picks' });
  }
});

// @route   GET /api/picks/my-picks
// @desc    Get current user's picks
// @access  Private
router.get('/my-picks', auth, async (req, res) => {
  try {
    const { eventId } = req.query;

    const whereClause = { user_id: req.user.id };
    if (eventId) {
      whereClause.event_id = eventId;
    }

    const picksRaw = await Pick.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'date', 'status', 'pickDeadline', 'fights']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const picks = picksRaw.map(p => ({
      ...p.toJSON(),
      accuracy: p.getAccuracy(),
      submittedAt: p.createdAt
    }));

    res.json({ picks });
  } catch (error) {
    console.error('Get my picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/picks/user/:userId
// @desc    Get user's picks
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { eventId } = req.query;

    // Users can only view their own picks unless they're admin
    if (req.user.id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view these picks' });
    }

    const whereClause = { user_id: userId };
    if (eventId) {
      whereClause.event_id = eventId;
    }

    const picksRaw = await Pick.findAll({
      where: whereClause,
      include: [{
        model: Event,
        as: 'event',
        attributes: ['id', 'name', 'date', 'status', 'pickDeadline', 'fights']
      }],
      order: [['createdAt', 'DESC']]
    });

    const picks = picksRaw.map(p => ({
      ...p.toJSON(),
      accuracy: p.getAccuracy(),
      submittedAt: p.createdAt
    }));

    res.json({ picks });
  } catch (error) {
    console.error('Get user picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/picks/event/:eventId
// @desc    Get all picks for an event (Admin only)
// @access  Private/Admin
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { eventId } = req.params;

    const picks = await Pick.findAll({
      where: { event_id: eventId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json({ picks });
  } catch (error) {
    console.error('Get event picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/picks/:pickId
// @desc    Update an existing pick set (only before deadline and by owner)
// @access  Private
router.put('/:pickId', auth, [
  body('picks')
    .isArray({ min: 1 })
    .withMessage('At least one pick is required'),
  body('picks.*.fightNumber')
    .isInt({ min: 1 })
    .withMessage('Valid fight number is required'),
  body('picks.*.winner')
    .isIn(['fighter1', 'fighter2'])
    .withMessage('Winner must be fighter1 or fighter2'),
  body('picks.*.method')
    .isIn(['KO/TKO', 'Submission', 'Decision'])
    .withMessage('Method must be KO/TKO, Submission, or Decision'),
  body('picks.*.round')
    .isInt({ min: 1, max: 5 })
    .withMessage('Round must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { pickId } = req.params;
    const { picks } = req.body;

    const existingPick = await Pick.findByPk(pickId, {
      include: [{ model: Event, as: 'event' }]
    });

    if (!existingPick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    if (existingPick.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this pick' });
    }

    const event = existingPick.event;
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'upcoming') {
      return res.status(400).json({ message: 'Cannot update picks for non-upcoming events' });
    }

    if (new Date() > new Date(event.pickDeadline)) {
      return res.status(400).json({ message: 'Pick deadline has passed' });
    }

    const eventFightNumbers = event.fights.map(f => f.fightNumber);
    const pickFightNumbers = picks.map(p => p.fightNumber);
    const invalidFights = pickFightNumbers.filter(fn => !eventFightNumbers.includes(fn));
    if (invalidFights.length > 0) {
      return res.status(400).json({
        message: `Invalid fight numbers: ${invalidFights.join(', ')}`
      });
    }

    existingPick.picks = picks;
    await existingPick.save();

    res.json({
      message: 'Picks updated successfully',
      pick: existingPick
    });
  } catch (error) {
    console.error('Update picks error:', error);
    res.status(500).json({ message: 'Server error updating picks' });
  }
});

module.exports = router; 