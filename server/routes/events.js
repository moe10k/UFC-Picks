const express = require('express');
const { Op } = require('sequelize');
const Event = require('../models/Event');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

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
router.post('/', adminAuth, async (req, res) => {
  try {
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
router.put('/:id', adminAuth, async (req, res) => {
  try {
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
    const picks = await require('../models/Pick').findAll({ where: { event_id: event.id, isSubmitted: true } });
    const usersById = new Map();
    for (const pick of picks) {
      let totalPoints = 0;
      let correctPicks = 0;
      for (const p of pick.picks) {
        const fight = updatedFights.find(f => f.fightNumber === p.fightNumber);
        if (!fight || !fight.result) continue;
        let points = 0;
        if (fight.result.winner === p.winner) {
          points += 3;
          correctPicks += 1;
        }
        if (fight.result.method && fight.result.method === p.method) points += 1;
        if (fight.result.round && fight.result.round === p.round) points += 1;
        totalPoints += points;
      }
      pick.totalPoints = totalPoints;
      pick.correctPicks = correctPicks;
      pick.isScored = true;
      pick.scoredAt = new Date();
      await pick.save();

      // Accumulate per-user updates
      const userId = pick.user_id;
      const prev = usersById.get(userId) || { totalPoints: 0, correctPicks: 0, totalPicks: 0, eventsParticipated: 0, bestEventScore: 0 };
      prev.totalPoints += totalPoints;
      prev.correctPicks += correctPicks;
      prev.totalPicks += pick.picks.length;
      prev.eventsParticipated += 1;
      prev.bestEventScore = Math.max(prev.bestEventScore, totalPoints);
      usersById.set(userId, prev);
    }

    // Update user aggregates
    const User = require('../models/User');
    for (const [userId, agg] of usersById.entries()) {
      const user = await User.findByPk(userId);
      if (!user) continue;
      await user.update({
        totalPoints: user.totalPoints + agg.totalPoints,
        totalPicks: user.totalPicks + agg.totalPicks,
        correctPicks: user.correctPicks + agg.correctPicks,
        eventsParticipated: user.eventsParticipated + agg.eventsParticipated,
        bestEventScore: Math.max(user.bestEventScore, agg.bestEventScore)
      });
    }

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
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.update({ isActive: false });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 