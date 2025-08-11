const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Event = require('../models/Event');
const { auth, adminAuth } = require('../middleware/auth');
const Pick = require('../models/Pick'); // Added missing import for Pick

const router = express.Router();

// Input validation middleware
const validateEventInput = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Event name must be between 1 and 200 characters')
    .escape(),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('venueName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Venue name must not exceed 100 characters')
    .escape(),
  body('venueCity')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Venue city must not exceed 100 characters')
    .escape(),
  body('venueState')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Venue state must not exceed 100 characters')
    .escape(),
  body('venueCountry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Venue country must not exceed 100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .escape(),
  body('pickDeadline')
    .isISO8601()
    .withMessage('Pick deadline must be a valid ISO 8601 date')
];

// Helper function to transform event data for frontend
const transformEventForFrontend = (event) => {
  const eventData = event.toJSON();
  return {
    ...eventData,
    venue: event.getVenue(),
    mainCardFights: event.getMainCardFights(),
    isUpcoming: event.isUpcoming(),
    formattedDate: event.getFormattedDate()
  };
};

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    const whereClause = { isActive: true };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const transformedEvents = events.map(transformEventForFrontend);

    res.json({
      events: transformedEvents,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(count / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < count,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/upcoming
// @desc    Get next upcoming event
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const event = await Event.findOne({
      where: {
        date: { [Op.gt]: new Date() },
        status: 'upcoming',
        isActive: true
      },
      order: [['date', 'ASC']]
    });

    if (!event) {
      return res.status(404).json({ message: 'No upcoming events found' });
    }

    const transformedEvent = transformEventForFrontend(event);
    res.json({ event: transformedEvent });
  } catch (error) {
    console.error('Get upcoming event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get specific event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const transformedEvent = transformEventForFrontend(event);
    res.json({ event: transformedEvent });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event (Admin only)
// @access  Private/Admin
router.post('/', adminAuth, validateEventInput, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      date,
      venue,
      venueName,
      venueCity,
      venueState,
      venueCountry,
      description,
      fights,
      pickDeadline
    } = req.body;

    if (!pickDeadline) {
      return res.status(400).json({ message: 'pickDeadline is required' });
    }

    const event = await Event.create({
      name,
      date: new Date(date),
      venueName: venue?.name || venueName,
      venueCity: venue?.city || venueCity,
      venueState: venue?.state || venueState || null,
      venueCountry: venue?.country || venueCountry,
      description,
      fights,
      pickDeadline: new Date(pickDeadline)
    });

    const transformedEvent = transformEventForFrontend(event);
    res.status(201).json({ message: 'Event created successfully', event: transformedEvent });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event (Admin only)
// @access  Private/Admin
router.put('/:id', adminAuth, validateEventInput, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const {
      name,
      date,
      venue,
      venueName,
      venueCity,
      venueState,
      venueCountry,
      description,
      fights,
      status,
      pickDeadline
    } = req.body;

    await event.update({
      name,
      date: date ? new Date(date) : event.date,
      venueName: venue?.name || venueName || event.venueName,
      venueCity: venue?.city || venueCity || event.venueCity,
      venueState: venue?.state || venueState || event.venueState,
      venueCountry: venue?.country || venueCountry || event.venueCountry,
      description,
      fights,
      status,
      pickDeadline: pickDeadline ? new Date(pickDeadline) : event.pickDeadline
    });

    const transformedEvent = transformEventForFrontend(event);
    res.json({ message: 'Event updated successfully', event: transformedEvent });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id/results
// @desc    Update event results and score picks (Admin only)
// @access  Private/Admin
router.put('/:id/results', adminAuth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { fightResults } = req.body;
    if (!Array.isArray(fightResults)) {
      return res.status(400).json({ message: 'fightResults must be an array' });
    }

    // Merge results into event.fights
    const fights = [...event.fights];
    const resultsByNumber = new Map(fightResults.map(r => [r.fightNumber, r]));
    const updatedFights = fights.map(f => {
      const r = resultsByNumber.get(f.fightNumber);
      if (!r) return f;
      return {
        ...f,
        result: {
          winner: r.winner,
          method: r.method,
          round: r.round,
          time: r.time || f.result?.time
        },
        isCompleted: true
      };
    });

    event.fights = updatedFights;
    event.status = 'completed';
    await event.save();

    // Score all submitted picks for this event
    const picks = await Pick.findAll({ 
      where: { event_id: event.id, isSubmitted: true },
      include: [{
        model: require('../models/User'),
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }]
    });
    const usersById = new Map();
    console.log(`\n🏆 Scoring ${picks.length} picks for event: ${event.name} (ID: ${event.id})`);
    
    for (const pick of picks) {
      let totalPoints = 0;
      let correctPicks = 0;
      const username = pick.user?.username || `User ${pick.user_id}`;
      console.log(`\n👤 Scoring picks for ${username} (Pick ID: ${pick.id}):`);
      
      for (const p of pick.picks) {
        const fight = updatedFights.find(f => f.fightNumber === p.fightNumber);
        if (!fight || !fight.result) {
          console.log(`  ⚠️  Fight ${p.fightNumber}: No result available`);
          continue;
        }
        
        let points = 0;
        const fighter1Name = fight.fighter1?.name || 'Fighter 1';
        const fighter2Name = fight.fighter2?.name || 'Fighter 2';
        const winnerName = fight.result.winner === 'fighter1' ? fighter1Name : fighter2Name;
        const pickedWinnerName = p.winner === 'fighter1' ? fighter1Name : fighter2Name;
        
        console.log(`  🥊 Fight ${p.fightNumber}: ${fighter1Name} vs ${fighter2Name}`);
        console.log(`    📝 ${username} picked: ${pickedWinnerName} by ${p.method}${p.round ? ` in round ${p.round}` : ''}${p.time ? ` at ${p.time}` : ''}`);
        console.log(`    🎯 Actual result: ${winnerName} by ${fight.result.method}${fight.result.round ? ` in round ${fight.result.round}` : ''}${fight.result.time ? ` at ${fight.result.time}` : ''}`);
        
        // Check if winner prediction is correct
        if (fight.result.winner === p.winner) {
          points += 3;
          correctPicks += 1;
          console.log(`    ✅ Winner correct (+3 points)`);
          
          // Only award bonus points for method and round if winner is correct
          // Check if method prediction is correct
          if (fight.result.method && fight.result.method === p.method) {
            points += 1;
            console.log(`    ✅ Method correct (+1 bonus point)`);
            
            // Check if round prediction is correct (only for non-Decision methods)
            if (fight.result.method !== 'Decision' && fight.result.round && p.round && fight.result.round === p.round) {
              points += 1;
              console.log(`    ✅ Round correct (+1 bonus point)`);
              
              // Check if time prediction is correct (only for KO/TKO and Submission methods)
              if ((fight.result.method === 'KO/TKO' || fight.result.method === 'Submission') && 
                  fight.result.time && p.time && fight.result.time === p.time) {
                points += 1;
                console.log(`    ✅ Time correct (+1 bonus point)`);
              } else if ((fight.result.method === 'KO/TKO' || fight.result.method === 'Submission') && 
                         fight.result.time && p.time) {
                console.log(`    ❌ Time incorrect (no bonus point)`);
              }
            } else if (fight.result.method !== 'Decision' && fight.result.round && p.round) {
              console.log(`    ❌ Round incorrect (no bonus point)`);
            }
          } else {
            console.log(`    ❌ Method incorrect (no bonus point)`);
          }
        } else {
          console.log(`    ❌ Winner incorrect - no points awarded`);
        }
        
        console.log(`    💰 Points earned for this fight: ${points}`);
        totalPoints += points;
      }
      
      console.log(`  📊 ${username}'s final score: ${totalPoints} points (${correctPicks}/${pick.picks.length} fights correct)`);
      pick.totalPoints = totalPoints;
      pick.correctPicks = correctPicks;
      pick.isScored = true;
      pick.scoredAt = new Date();
      await pick.save();

      // Accumulate per-user updates
      const userId = pick.user_id;
      const prev = usersById.get(userId) || { totalPoints: 0, correctPicks: 0, totalPicks: 0, eventsParticipated: 0, bestEventScore: 0, pickIds: [] };
      prev.totalPoints += totalPoints;
      prev.correctPicks += correctPicks;
      prev.totalPicks += pick.picks.length;
      prev.eventsParticipated += 1;
      prev.bestEventScore = Math.max(prev.bestEventScore, totalPoints);
      prev.pickIds.push(pick.id);
      usersById.set(userId, prev);
    }

    // Update user aggregates
    const User = require('../models/User');
    console.log(`\n🔄 Updating user statistics...`);
    for (const [userId, agg] of usersById.entries()) {
      const user = await User.findByPk(userId);
      if (!user) continue;
      
      // Check if this user has already been scored for this event
      const existingPick = await Pick.findOne({
        where: { 
          user_id: userId, 
          event_id: event.id,
          isScored: true 
        }
      });
      
      if (existingPick && !agg.pickIds.includes(existingPick.id)) {
        // This user was already scored for this event, we need to recalculate totals
        console.log(`  🔄 ${user.username}: Recalculating totals from all picks...`);
        
        // Get all scored picks for this user across all events
        const allUserPicks = await Pick.findAll({
          where: { 
            user_id: userId, 
            isScored: true 
          },
          include: [{
            model: Event,
            as: 'event',
            where: { isActive: true }
          }]
        });
        
        // Calculate totals from scratch
        let recalculatedTotalPoints = 0;
        let recalculatedCorrectPicks = 0;
        let recalculatedTotalPicks = 0;
        let recalculatedEventsParticipated = 0;
        let recalculatedBestEventScore = 0;
        
        for (const userPick of allUserPicks) {
          recalculatedTotalPoints += userPick.totalPoints || 0;
          recalculatedCorrectPicks += userPick.correctPicks || 0;
          recalculatedTotalPicks += userPick.picks?.length || 0;
          recalculatedEventsParticipated += 1;
          recalculatedBestEventScore = Math.max(recalculatedBestEventScore, userPick.totalPoints || 0);
        }
        
        await user.update({
          totalPoints: recalculatedTotalPoints,
          totalPicks: recalculatedTotalPicks,
          correctPicks: recalculatedCorrectPicks,
          eventsParticipated: recalculatedEventsParticipated,
          bestEventScore: recalculatedBestEventScore
        });
        
        console.log(`  👤 ${user.username}: Recalculated totals - ${recalculatedTotalPoints} points, ${recalculatedCorrectPicks}/${recalculatedTotalPicks} correct`);
      } else {
        // First time scoring this event for this user, add to existing totals
        await user.update({
          totalPoints: user.totalPoints + agg.totalPoints,
          totalPicks: user.totalPicks + agg.totalPicks,
          correctPicks: user.correctPicks + agg.correctPicks,
          eventsParticipated: user.eventsParticipated + agg.eventsParticipated,
          bestEventScore: Math.max(user.bestEventScore, agg.bestEventScore)
        });
        console.log(`  👤 ${user.username}: +${agg.totalPoints} points, ${agg.correctPicks}/${agg.totalPicks} correct`);
      }
    }

    console.log(`\n🎉 Event scoring completed! ${picks.length} users scored.`);
    res.json({ message: 'Results updated and picks scored', event });
  } catch (error) {
    console.error('Update event results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event (Admin only)
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { hardDelete = false } = req.query; // Option to completely remove picks
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (hardDelete === 'true') {
      // Hard delete: Remove all picks for this event
      console.log(`🗑️  Hard deleting event ${event.name} and all associated picks...`);
      
      const Pick = require('../models/Pick');
      const deletedPicks = await Pick.destroy({
        where: { event_id: event.id }
      });
      
      await event.destroy(); // Completely remove the event
      
      console.log(`✅ Event ${event.name} and ${deletedPicks} picks completely removed`);
      res.json({ 
        message: 'Event and all picks completely removed', 
        picksDeleted: deletedPicks 
      });
    } else {
      // Soft delete: Mark event as inactive (picks remain but won't show in UI)
      console.log(`🚫 Soft deleting event ${event.name} (marking as inactive)...`);
      
      await event.update({ isActive: false });
      
      console.log(`✅ Event ${event.name} marked as inactive`);
      res.json({ 
        message: 'Event marked as inactive (picks preserved)', 
        note: 'Use ?hardDelete=true to completely remove event and picks'
      });
    }
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/recalculate-stats
// @desc    Recalculate all user statistics from their actual picks (Admin only)
// @access  Private/Admin
router.post('/recalculate-stats', adminAuth, async (req, res) => {
  try {
    const { recalculateAllUserStats } = require('../utils/recalculateUserStats');
    
    console.log('🔄 Admin requested user statistics recalculation...');
    const result = await recalculateAllUserStats();
    
    if (result.success) {
      res.json({ 
        message: 'User statistics recalculated successfully', 
        usersUpdated: result.usersUpdated 
      });
    } else {
      res.status(500).json({ 
        message: 'Error during recalculation', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Recalculate stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/recalculate-stats/:userId
// @desc    Recalculate statistics for a specific user (Admin only)
// @access  Private/Admin
router.post('/recalculate-stats/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { recalculateUserStats } = require('../utils/recalculateUserStats');
    
    console.log(`🔄 Admin requested statistics recalculation for user ${userId}...`);
    const result = await recalculateUserStats(userId);
    
    if (result.success) {
      res.json({ 
        message: 'User statistics recalculated successfully', 
        user: result.user,
        stats: result.stats
      });
    } else {
      res.status(500).json({ 
        message: 'Error during recalculation', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Recalculate user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/cleanup-orphaned-picks
// @desc    Clean up picks for deleted/inactive events (Admin only)
// @access  Private/Admin
router.post('/cleanup-orphaned-picks', adminAuth, async (req, res) => {
  try {
    const { action = 'report' } = req.query; // 'report' or 'delete'
    const Pick = require('../models/Pick');
    
    console.log('🧹 Starting orphaned picks cleanup...');
    
    // Find picks for inactive events
    const orphanedPicks = await Pick.findAll({
      include: [{
        model: Event,
        as: 'event',
        where: { isActive: false }
      }]
    });
    
    console.log(`📊 Found ${orphanedPicks.length} picks for inactive events`);
    
    if (action === 'delete' && orphanedPicks.length > 0) {
      // Delete the orphaned picks
      const pickIds = orphanedPicks.map(p => p.id);
      const deletedCount = await Pick.destroy({
        where: { id: pickIds }
      });
      
      console.log(`🗑️  Deleted ${deletedCount} orphaned picks`);
      
      res.json({
        message: 'Orphaned picks cleaned up successfully',
        picksDeleted: deletedCount,
        totalOrphaned: orphanedPicks.length
      });
    } else {
      // Just report the orphaned picks
      const report = orphanedPicks.map(pick => ({
        pickId: pick.id,
        userId: pick.user_id,
        eventId: pick.event_id,
        eventName: pick.event?.name || 'Unknown Event',
        eventDate: pick.event?.date,
        pickCount: pick.picks?.length || 0,
        isSubmitted: pick.isSubmitted,
        isScored: pick.isScored
      }));
      
      res.json({
        message: 'Orphaned picks report generated',
        totalOrphaned: orphanedPicks.length,
        report,
        note: 'Use ?action=delete to actually remove these picks'
      });
    }
  } catch (error) {
    console.error('Cleanup orphaned picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/deleted
// @desc    Get list of deleted/inactive events (Admin only)
// @access  Private/Admin
router.get('/deleted', adminAuth, async (req, res) => {
  try {
    const deletedEvents = await Event.findAll({
      where: { isActive: false },
      attributes: ['id', 'name', 'date', 'status', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']]
    });
    
    res.json({
      deletedEvents,
      total: deletedEvents.length
    });
  } catch (error) {
    console.error('Get deleted events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/restore
// @desc    Restore a deleted event (Admin only)
// @access  Private/Admin
router.post('/:id/restore', adminAuth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.isActive) {
      return res.status(400).json({ message: 'Event is already active' });
    }
    
    await event.update({ isActive: true });
    
    console.log(`✅ Event ${event.name} restored to active status`);
    res.json({ 
      message: 'Event restored successfully',
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        status: event.status
      }
    });
  } catch (error) {
    console.error('Restore event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 