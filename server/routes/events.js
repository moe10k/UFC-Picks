const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Event = require('../models/Event');
const Fight = require('../models/Fight');
const Pick = require('../models/Pick');
const PickDetail = require('../models/PickDetail');
const UserStats = require('../models/UserStats');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (only if credentials provided)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Multer config for in-memory storage and basic limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

const router = express.Router();

// Helper function to format fighter record
const formatFighterRecord = (record) => {
  if (!record) return '';
  
  // If it's already a string, return it
  if (typeof record === 'string') return record;
  
  // If it's an object with wins, losses, draws properties
  if (record && typeof record === 'object' && record.wins !== undefined) {
    const { wins, losses, draws } = record;
    if (draws > 0) {
      return `${wins}-${losses}-${draws}`;
    } else {
      return `${wins}-${losses}`;
    }
  }
  
  // If it's any other object, try to convert to string
  return String(record);
};

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

// Helper function to determine event status based on date and results
const determineEventStatus = (event) => {
  // If event has a stored status, use that first (especially for completed events)
  if (event.status && event.status !== 'upcoming') {
    return event.status;
  }
  
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // If event has results, it's completed
  if (event.fights && event.fights.some(fight => fight.isCompleted)) {
    return 'completed';
  }
  
  // If event date has passed, it should be live
  if (eventDate <= now) {
    return 'live';
  }
  
  // Otherwise, it's upcoming
  return 'upcoming';
};

// Helper function to transform event data for frontend
const transformEventForFrontend = (event) => {
  const eventData = event.toJSON();
  
  // Determine the actual status based on current time and results
  const actualStatus = determineEventStatus(event);
  
  return {
    ...eventData,
    status: actualStatus, // Use the determined status (which now prioritizes stored status)
    venue: event.getVenue(),
    mainCardFights: event.fights ? event.fights.filter(f => f.isMainCard) : [],
    isUpcoming: actualStatus === 'upcoming',
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
    
    // If filtering by status, use the stored status field
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereClause,
      include: [{ model: Fight, as: 'fights' }],
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
// @desc    Get next upcoming or live event
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const event = await Event.findOne({
      where: {
        [Op.or]: [
          // Upcoming events (future date, status upcoming)
          {
            date: { [Op.gt]: new Date() },
            status: 'upcoming',
            isActive: true
          },
          // Live events (past date but not completed, status live or upcoming)
          {
            date: { [Op.lte]: new Date() },
            status: { [Op.in]: ['upcoming', 'live'] },
            isActive: true
          }
        ]
      },
      include: [{ model: Fight, as: 'fights' }],
      order: [['date', 'ASC']]
    });

    if (!event) {
      return res.status(404).json({ message: 'No upcoming or live events found' });
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
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Fight, as: 'fights' }]
    });
    
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
      pickDeadline: new Date(pickDeadline)
    });

    // Create fights if provided
    if (fights && Array.isArray(fights)) {
      const fightPromises = fights.map(fightData => 
        Fight.create({
          eventId: event.id,
          fightNumber: fightData.fightNumber,
          weightClass: fightData.weightClass,
          isMainCard: fightData.isMainCard || false,
          isMainEvent: fightData.isMainEvent || false,
          isCoMainEvent: fightData.isCoMainEvent || false,
          fighter1Name: fightData.fighter1?.name || fightData.fighter1Name,
          fighter2Name: fightData.fighter2?.name || fightData.fighter2Name,
          fighter1Nick: fightData.fighter1?.nickname || fightData.fighter1Nick,
          fighter2Nick: fightData.fighter2?.nickname || fightData.fighter2Nick,
          fighter1Image: fightData.fighter1?.image || fightData.fighter1Image,
          fighter2Image: fightData.fighter2?.image || fightData.fighter2Image,
          fighter1Record: formatFighterRecord(fightData.fighter1?.record || fightData.fighter1Record),
          fighter2Record: formatFighterRecord(fightData.fighter2?.record || fightData.fighter2Record)
        })
      );
      
      await Promise.all(fightPromises);
    }

    // Reload event with fights
    const eventWithFights = await Event.findByPk(event.id, {
      include: [{ model: Fight, as: 'fights' }]
    });

    const transformedEvent = transformEventForFrontend(eventWithFights);
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

    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Fight, as: 'fights' }]
    });
    
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
      status,
      pickDeadline: pickDeadline ? new Date(pickDeadline) : event.pickDeadline
    });

    // Update fights if provided
    if (fights && Array.isArray(fights)) {
      // Delete existing fights
      await Fight.destroy({ where: { eventId: event.id } });
      
      // Create new fights
      const fightPromises = fights.map(fightData => 
        Fight.create({
          eventId: event.id,
          fightNumber: fightData.fightNumber,
          weightClass: fightData.weightClass,
          isMainCard: fightData.isMainCard || false,
          isMainEvent: fightData.isMainEvent || false,
          isCoMainEvent: fightData.isCoMainEvent || false,
          fighter1Name: fightData.fighter1?.name || fightData.fighter1Name,
          fighter2Name: fightData.fighter2?.name || fightData.fighter2Name,
          fighter1Nick: fightData.fighter1?.nickname || fightData.fighter1Nick,
          fighter2Nick: fightData.fighter2?.nickname || fightData.fighter2Nick,
          fighter1Image: fightData.fighter1?.image || fightData.fighter1Image,
          fighter2Image: fightData.fighter2?.image || fightData.fighter2Image,
          fighter1Record: formatFighterRecord(fightData.fighter1?.record || fightData.fighter1Record),
          fighter2Record: formatFighterRecord(fightData.fighter2?.record || fightData.fighter2Record)
        })
      );
      
      await Promise.all(fightPromises);
    }

    // Reload event with fights
    const updatedEvent = await Event.findByPk(event.id, {
      include: [{ model: Fight, as: 'fights' }]
    });

    const transformedEvent = transformEventForFrontend(updatedEvent);
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
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Fight, as: 'fights' }]
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { fightResults } = req.body;
    if (!Array.isArray(fightResults)) {
      return res.status(400).json({ message: 'fightResults must be an array' });
    }

    // Update fight results
    for (const result of fightResults) {
      const fight = event.fights.find(f => f.fightNumber === result.fightNumber);
      if (fight) {
        await fight.update({
          winner: result.winner,
          method: result.method,
          round: result.round,
          time: result.time || fight.time,
          isCompleted: true
        });
      }
    }

    // Update event status to completed since we now have results
    await event.update({ status: 'completed' });

    // Score all submitted picks for this event
    const picks = await Pick.findAll({ 
      where: { event_id: event.id, isSubmitted: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: PickDetail,
          as: 'pickDetails'
        }
      ]
    });

    const usersById = new Map();
    console.log(`\n🏆 Scoring ${picks.length} picks for event: ${event.name} (ID: ${event.id})`);
    
    for (const pick of picks) {
      let totalPoints = 0;
      let correctPicks = 0;
      const username = pick.user?.username || `User ${pick.user_id}`;
      console.log(`\n👤 Scoring picks for ${username} (Pick ID: ${pick.id}):`);
      
      for (const pickDetail of pick.pickDetails) {
        const fight = event.fights.find(f => f.id === pickDetail.fightId);
        if (!fight || !fight.isCompleted) {
          console.log(`  ⚠️  Fight ${fight?.fightNumber}: No result available`);
          continue;
        }
        
        let points = 0;
        const fighter1Name = fight.fighter1Name || 'Fighter 1';
        const fighter2Name = fight.fighter2Name || 'Fighter 2';
        const winnerName = fight.winner === 'fighter1' ? fighter1Name : fighter2Name;
        const pickedWinnerName = pickDetail.predictedWinner === 'fighter1' ? fighter1Name : fighter2Name;
        
        console.log(`  🥊 Fight ${fight.fightNumber}: ${fighter1Name} vs ${fighter2Name}`);
        console.log(`    📝 ${username} picked: ${pickedWinnerName} by ${pickDetail.predictedMethod}${pickDetail.predictedRound ? ` in round ${pickDetail.predictedRound}` : ''}${pickDetail.predictedTime ? ` at ${pickDetail.predictedTime}` : ''}`);
        console.log(`    🎯 Actual result: ${winnerName} by ${fight.method}${fight.round ? ` in round ${fight.round}` : ''}${fight.time ? ` at ${fight.time}` : ''}`);
        
        // Check if winner prediction is correct
        if (fight.winner === pickDetail.predictedWinner) {
          points += 3;
          correctPicks += 1;
          console.log(`    ✅ Winner correct (+3 points)`);
          
          // Only award bonus points for method and round if winner is correct
          // Check if method prediction is correct
          if (fight.method && fight.method === pickDetail.predictedMethod) {
            points += 1;
            console.log(`    ✅ Method correct (+1 bonus point)`);
            
            // Check if round prediction is correct (only for non-Decision methods)
            if (fight.method !== 'Decision' && fight.round && pickDetail.predictedRound && fight.round === pickDetail.predictedRound) {
              points += 1;
              console.log(`    ✅ Round correct (+1 bonus point)`);
              
              // Check if time prediction is correct (only for KO/TKO and Submission methods)
              if ((fight.method === 'KO/TKO' || fight.method === 'Submission') && 
                  fight.time && pickDetail.predictedTime && fight.time === pickDetail.predictedTime) {
                points += 1;
                console.log(`    ✅ Time correct (+1 bonus point)`);
              } else if ((fight.method === 'KO/TKO' || fight.method === 'Submission') && 
                         fight.time && pickDetail.predictedTime) {
                console.log(`    ❌ Time incorrect (no bonus point)`);
              }
            } else if (fight.method !== 'Decision' && fight.round && pickDetail.predictedRound) {
              console.log(`    ❌ Round incorrect (no bonus point)`);
            }
          } else {
            console.log(`    ❌ Method incorrect (no bonus point)`);
          }
        } else {
          console.log(`    ❌ Winner incorrect - no points awarded`);
        }
        
        console.log(`    💰 Points earned for this fight: ${points}`);
        
        // Update pick detail with results
        await pickDetail.update({
          pointsEarned: points,
          isCorrect: fight.winner === pickDetail.predictedWinner,
          scoredAt: new Date()
        });
        
        totalPoints += points;
      }
      
      console.log(`  📊 ${username}'s final score: ${totalPoints} points (${correctPicks}/${pick.pickDetails.length} fights correct)`);
      
      // Update pick with totals
      await pick.update({
        totalPoints,
        correctPicks,
        totalPicks: pick.pickDetails.length,
        isScored: true,
        scoredAt: new Date()
      });

      // Accumulate per-user updates
      const userId = pick.user_id;
      const prev = usersById.get(userId) || { totalPoints: 0, correctPicks: 0, totalPicks: 0, eventsParticipated: 0, bestEventScore: 0, pickIds: [] };
      prev.totalPoints += totalPoints;
      prev.correctPicks += correctPicks;
      prev.totalPicks += pick.pickDetails.length;
      prev.eventsParticipated += 1;
      prev.bestEventScore = Math.max(prev.bestEventScore, totalPoints);
      prev.pickIds.push(pick.id);
      usersById.set(userId, prev);
    }

    // Update user stats using the new UserStats table
    console.log(`\n🔄 Updating user statistics...`);
    for (const [userId, agg] of usersById.entries()) {
      const user = await User.findByPk(userId);
      if (!user) continue;
      
      // Get or create user stats
      let userStats = await UserStats.findOne({ where: { userId } });
      if (!userStats) {
        userStats = await UserStats.create({ userId });
      }
      
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
          recalculatedTotalPicks += userPick.totalPicks || 0;
          recalculatedEventsParticipated += 1;
          recalculatedBestEventScore = Math.max(recalculatedBestEventScore, userPick.totalPoints || 0);
        }
        
        await userStats.update({
          totalPoints: recalculatedTotalPoints,
          totalPicks: recalculatedTotalPicks,
          correctPicks: recalculatedCorrectPicks,
          eventsParticipated: recalculatedEventsParticipated,
          bestEventScore: recalculatedBestEventScore
        });
        
        console.log(`  👤 ${user.username}: Recalculated totals - ${recalculatedTotalPoints} points, ${recalculatedCorrectPicks}/${recalculatedTotalPicks} correct`);
      } else {
        // First time scoring this event for this user, add to existing totals
        await userStats.update({
          totalPoints: userStats.totalPoints + agg.totalPoints,
          totalPicks: userStats.totalPicks + agg.totalPicks,
          correctPicks: userStats.correctPicks + agg.correctPicks,
          eventsParticipated: userStats.eventsParticipated + agg.eventsParticipated,
          bestEventScore: Math.max(userStats.bestEventScore, agg.bestEventScore)
        });
        console.log(`  👤 ${user.username}: +${agg.totalPoints} points, ${agg.correctPicks}/${agg.totalPicks} correct`);
      }
    }

    console.log(`\n🎉 Event scoring completed! ${picks.length} users scored.`);
    
    // Reload event with updated fights
    const updatedEvent = await Event.findByPk(event.id, {
      include: [{ model: Fight, as: 'fights' }]
    });
    
    res.json({ message: 'Results updated and picks scored', event: updatedEvent });
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
    const { hardDelete = 'true' } = req.query; // Default to hard delete for complete cleanup
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (hardDelete === 'true') {
      // Hard delete: Remove all picks for this event and then the event itself
      console.log(`🗑️  Hard deleting event ${event.name} and all associated data...`);
      
      // First, get all pick IDs for this event
      const picksToDelete = await Pick.findAll({
        where: { event_id: event.id },
        attributes: ['id']
      });
      
      const pickIds = picksToDelete.map(p => p.id);
      
      if (pickIds.length > 0) {
        // Delete all pick details for these picks
        const deletedPickDetails = await PickDetail.destroy({
          where: { pickId: pickIds }
        });
        console.log(`🗑️  Deleted ${deletedPickDetails} pick details for event ${event.name}`);
      }
      
      // Then delete all picks for this event
      const deletedPicks = await Pick.destroy({
        where: { event_id: event.id }
      });
      
      console.log(`🗑️  Deleted ${deletedPicks} picks for event ${event.name}`);
      
      // Delete all fights for this event
      const deletedFights = await Fight.destroy({
        where: { event_id: event.id }
      });
      
      console.log(`🗑️  Deleted ${deletedFights} fights for event ${event.name}`);
      
      // Finally delete the event itself
      await event.destroy();
      
      console.log(`✅ Event ${event.name} and all associated data completely removed`);
      res.json({ 
        message: 'Event and all associated data completely removed', 
        picksDeleted: deletedPicks,
        pickDetailsDeleted: pickIds.length > 0 ? 'all' : 0,
        fightsDeleted: deletedFights
      });
    } else {
      // Soft delete: Mark event as inactive (picks remain but won't show in UI)
      console.log(`🚫 Soft deleting event ${event.name} (marking as inactive)...`);
      
      await event.update({ isActive: false });
      
      console.log(`✅ Event ${event.name} marked as inactive`);
      res.json({ 
        message: 'Event marked as inactive (picks preserved)', 
        note: 'Use ?hardDelete=false to preserve event data'
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
      
      // Delete the orphaned pick details
      await PickDetail.destroy({
        where: { pickId: pickIds }
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
        pickCount: pick.pickDetails?.length || 0,
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

// @route   POST /api/events/force-cleanup-all
// @desc    Force cleanup all orphaned picks and inactive events (Admin only)
// @access  Private/Admin
router.post('/force-cleanup-all', adminAuth, async (req, res) => {
  try {
    console.log('🧹 Starting force cleanup of all orphaned data...');
    
    // First, find all picks for inactive events
    const orphanedPicks = await Pick.findAll({
      include: [{
        model: Event,
        as: 'event',
        where: { isActive: false }
      }]
    });
    
    console.log(`📊 Found ${orphanedPicks.length} picks for inactive events`);
    
    // Delete all orphaned picks
    let deletedPicks = 0;
    if (orphanedPicks.length > 0) {
      const pickIds = orphanedPicks.map(p => p.id);
      deletedPicks = await Pick.destroy({
        where: { id: pickIds }
      });
      // Delete the orphaned pick details
      await PickDetail.destroy({
        where: { pickId: pickIds }
      });
      console.log(`🗑️  Deleted ${deletedPicks} orphaned picks`);
    }
    
    // Find all inactive events
    const inactiveEvents = await Event.findAll({
      where: { isActive: false }
    });
    
    console.log(`📊 Found ${inactiveEvents.length} inactive events`);
    
    // Delete all inactive events
    let deletedEvents = 0;
    if (inactiveEvents.length > 0) {
      deletedEvents = await Event.destroy({
        where: { isActive: false }
      });
      console.log(`🗑️  Deleted ${deletedEvents} inactive events`);
    }
    
    console.log(`✅ Force cleanup completed: ${deletedPicks} picks and ${deletedEvents} events removed`);
    
    res.json({
      message: 'Force cleanup completed successfully',
      picksDeleted: deletedPicks,
      eventsDeleted: deletedEvents,
      totalCleaned: deletedPicks + deletedEvents
    });
  } catch (error) {
    console.error('Force cleanup error:', error);
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

// @route   POST /api/events/fix-completed-status
// @desc    Fix all events that have completed fights but wrong status (Admin only)
// @access  Private/Admin
router.post('/fix-completed-status', adminAuth, async (req, res) => {
  try {
    console.log('🔍 Finding events with completed fights that need status fix...');
    
    // Find all events that have fights with isCompleted = true
    const eventsWithCompletedFights = await Event.findAll({
      include: [{
        model: Fight,
        as: 'fights',
        where: { isCompleted: true }
      }],
      where: { isActive: true }
    });
    
    console.log(`📊 Found ${eventsWithCompletedFights.length} events with completed fights`);
    
    const updatedEvents = [];
    
    // Update each event's status to 'completed'
    for (const event of eventsWithCompletedFights) {
      if (event.status !== 'completed') {
        console.log(`🔄 Updating event "${event.name}" (ID: ${event.id}) from status "${event.status}" to "completed"`);
        await event.update({ status: 'completed' });
        updatedEvents.push({
          id: event.id,
          name: event.name,
          oldStatus: event.status,
          newStatus: 'completed'
        });
      } else {
        console.log(`✅ Event "${event.name}" (ID: ${event.id}) already has status "completed"`);
      }
    }
    
    // Also check for events that might have the old status logic
    console.log('\n🔍 Checking for events that might need status updates...');
    
    const allEvents = await Event.findAll({
      include: [{ model: Fight, as: 'fights' }],
      where: { isActive: true }
    });
    
    for (const event of allEvents) {
      const hasCompletedFights = event.fights && event.fights.some(fight => fight.isCompleted);
      const shouldBeCompleted = hasCompletedFights || event.status === 'completed';
      
      if (shouldBeCompleted && event.status !== 'completed') {
        console.log(`🔄 Updating event "${event.name}" (ID: ${event.id}) from status "${event.status}" to "completed"`);
        await event.update({ status: 'completed' });
        updatedEvents.push({
          id: event.id,
          name: event.name,
          oldStatus: event.status,
          newStatus: 'completed'
        });
      }
    }
    
    console.log('\n✅ Completed events status fix completed!');
    
    // Show final status of all events
    const finalEvents = await Event.findAll({
      include: [{ model: Fight, as: 'fights' }],
      where: { isActive: true },
      order: [['date', 'DESC']]
    });
    
    const finalStatuses = finalEvents.map(event => ({
      id: event.id,
      name: event.name,
      status: event.status,
      completedFights: event.fights ? event.fights.filter(f => f.isCompleted).length : 0,
      totalFights: event.fights ? event.fights.length : 0
    }));
    
    res.json({
      message: 'Completed events status fix completed successfully',
      updatedEvents,
      finalStatuses,
      totalEvents: finalEvents.length,
      completedEvents: finalEvents.filter(e => e.status === 'completed').length
    });
    
  } catch (error) {
    console.error('Fix completed events status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/upload-fighter-image
// @desc    Upload fighter image and return Cloudinary URL (Admin only)
// @access  Private/Admin
router.post('/upload-fighter-image', adminAuth, upload.single('fighterImage'), async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ message: 'Image upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const mimeType = req.file.mimetype || '';
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    // Convert buffer to data URI for Cloudinary
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    const uploadOptions = {
      folder: 'ufc-picks/fighter-images',
      public_id: `fighter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { radius: 'max' } // Make it circular
      ]
    };

    const uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);

    return res.json({
      message: 'Fighter image uploaded successfully',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
  } catch (error) {
    console.error('Fighter image upload error:', error);
    if (error.message && error.message.includes('File too large')) {
      return res.status(400).json({ message: 'File too large. Max size is 2MB.' });
    }
    return res.status(500).json({ message: 'Server error uploading fighter image' });
  }
});

module.exports = router; 