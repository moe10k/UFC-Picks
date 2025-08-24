const express = require('express');
const { body, validationResult } = require('express-validator');
const Pick = require('../models/Pick');
const PickDetail = require('../models/PickDetail');
const Event = require('../models/Event');
const Fight = require('../models/Fight');
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
    .optional()
    .custom((value, { req, path }) => {
      const pickIndex = path.split('.')[1];
      const method = req.body.picks[pickIndex]?.method;
      
      // If method is Decision, round is not required
      if (method === 'Decision') {
        return true;
      }
      
      // For other methods, round must be between 1 and 5
      if (!value || !Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error('Round must be between 1 and 5 for KO/TKO and Submission methods');
      }
      
      return true;
    })
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
    const event = await Event.findByPk(eventId, {
      include: [{ model: Fight, as: 'fights' }]
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Determine actual event status based on date and results
    const now = new Date();
    const eventDate = new Date(event.date);
    
    // If event has results, it's completed
    if (event.fights && event.fights.some(fight => fight.isCompleted)) {
      return res.status(400).json({ message: 'Picks cannot be submitted for completed events' });
    }
    
    // If event date has passed, it should be live
    if (eventDate <= now) {
      return res.status(400).json({ message: 'Picks cannot be submitted for live events' });
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
      // If picks are already submitted, update them instead
      // Delete existing pick details
      await PickDetail.destroy({ where: { pickId: existingPick.id } });
      
      // Create new pick details
      const pickDetailPromises = picks.map(pickData => {
        const fight = event.fights.find(f => f.fightNumber === pickData.fightNumber);
        if (!fight) {
          throw new Error(`Fight ${pickData.fightNumber} not found in event`);
        }
        
        return PickDetail.create({
          pickId: existingPick.id,
          fightId: fight.id,
          predictedWinner: pickData.winner,
          predictedMethod: pickData.method,
          predictedRound: pickData.round,
          predictedTime: pickData.time
        });
      });
      
      await Promise.all(pickDetailPromises);
      
      // Update pick totals
      await existingPick.update({
        totalPicks: picks.length,
        submittedAt: new Date()
      });
      
      res.json({
        message: 'Picks updated successfully',
        pick: existingPick
      });
      return;
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
      // Delete existing pick details
      await PickDetail.destroy({ where: { pickId: existingPick.id } });
    } else {
      userPick = await Pick.create({
        userId: req.user.id,
        eventId: eventId,
        totalPicks: picks.length
      });
    }

    // Create pick details
    const pickDetailPromises = picks.map(pickData => {
      const fight = event.fights.find(f => f.fightNumber === pickData.fightNumber);
      return PickDetail.create({
        pickId: userPick.id,
        fightId: fight.id,
        predictedWinner: pickData.winner,
        predictedMethod: pickData.method,
        predictedRound: pickData.round,
        predictedTime: pickData.time
      });
    });
    
    await Promise.all(pickDetailPromises);

    // Submit picks
    userPick.isSubmitted = true;
    userPick.submittedAt = new Date();
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
          where: { isActive: true }, // Only include active events
          attributes: ['id', 'name', 'date', 'status', 'pickDeadline']
        },
        {
          model: PickDetail,
          as: 'pickDetails',
          include: [{
            model: Fight,
            as: 'fight',
            attributes: ['id', 'fightNumber', 'weightClass', 'fighter1Name', 'fighter2Name', 'isMainCard', 'isMainEvent', 'isCoMainEvent']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const picks = picksRaw.map(p => ({
      ...p.toJSON(),
      accuracy: p.getAccuracyDecimal(),
      submittedAt: p.submittedAt || p.createdAt
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
      include: [
        {
          model: Event,
          as: 'event',
          where: { isActive: true }, // Only include active events
          attributes: ['id', 'name', 'date', 'status', 'pickDeadline']
        },
        {
          model: PickDetail,
          as: 'pickDetails',
          include: [{
            model: Fight,
            as: 'fight',
            attributes: ['id', 'fightNumber', 'weightClass', 'fighter1Name', 'fighter2Name', 'isMainCard', 'isMainEvent', 'isCoMainEvent']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const picks = picksRaw.map(p => ({
      ...p.toJSON(),
      accuracy: p.getAccuracyDecimal(),
      submittedAt: p.submittedAt || p.createdAt
    }));

    res.json({ picks });
  } catch (error) {
    console.error('Get user picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/picks/event/:eventId
// @desc    Get all picks for an event (Users can see picks for events they're participating in)
// @access  Private
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user has picks for this event (they're participating)
    const userPick = await Pick.findOne({
      where: { user_id: req.user.id, event_id: eventId }
    });

    // If user is not participating in this event, only admins can view picks
    if (!userPick && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You must participate in this event to view other players picks' });
    }

    const picks = await Pick.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: PickDetail,
          as: 'pickDetails',
          include: [{
            model: Fight,
            as: 'fight',
            attributes: ['id', 'fightNumber', 'weightClass', 'fighter1Name', 'fighter2Name', 'isMainCard', 'isMainEvent', 'isCoMainEvent']
          }]
        }
      ],
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
    .optional()
    .custom((value, { req, path }) => {
      const pickIndex = path.split('.')[1];
      const method = req.body.picks[pickIndex]?.method;
      
      // If method is Decision, round is not required
      if (method === 'Decision') {
        return true;
      }
      
      // For other methods, round must be between 1 and 5
      if (!value || !Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error('Round must be between 1 and 5 for KO/TKO and Submission methods');
      }
      
      return true;
    })
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
      include: [{ model: Event, as: 'event', include: [{ model: Fight, as: 'fights' }] }]
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

    // Determine actual event status based on date and results
    const now = new Date();
    const eventDate = new Date(event.date);
    
    // If event has results, it's completed
    if (event.fights && event.fights.some(fight => fight.isCompleted)) {
      return res.status(400).json({ message: 'Cannot update picks for completed events' });
    }
    
    // If event date has passed, it should be live
    if (eventDate <= now) {
      return res.status(400).json({ message: 'Cannot update picks for live events' });
    }

    if (new Date() > new Date(event.pickDeadline)) {
      return res.status(400).json({ message: 'Pick deadline has passed' });
    }

    // Update picks if provided
    if (picks && Array.isArray(picks)) {
      // Delete existing pick details
      await PickDetail.destroy({ where: { pickId: existingPick.id } });
      
      // Create new pick details
      const pickDetailPromises = picks.map(pickData => {
        const fight = event.fights.find(f => f.fightNumber === pickData.fightNumber);
        if (!fight) {
          throw new Error(`Fight ${pickData.fightNumber} not found in event`);
        }
        
        return PickDetail.create({
          pickId: existingPick.id,
          fightId: fight.id,
          predictedWinner: pickData.winner,
          predictedMethod: pickData.method,
          predictedRound: pickData.round,
          predictedTime: pickData.time
        });
      });
      
      await Promise.all(pickDetailPromises);
      
      // Update pick totals
      await existingPick.update({
        totalPicks: picks.length,
        submittedAt: new Date()
      });
    }

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