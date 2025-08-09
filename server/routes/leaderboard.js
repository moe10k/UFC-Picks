const express = require('express');
const { Op, fn, col } = require('sequelize');
const User = require('../models/User');
const Pick = require('../models/Pick');
const Event = require('../models/Event');

const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get global leaderboard
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    // Get users with their stats, sorted by total points
    const { count, rows: users } = await User.findAndCountAll({
      where: { isActive: true },
      attributes: ['id', 'username', 'totalPicks', 'correctPicks', 'totalPoints', 'eventsParticipated', 'bestEventScore', 'currentStreak', 'longestStreak'],
      order: [['totalPoints', 'DESC'], ['correctPicks', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Calculate rankings
    const leaderboard = users.map((user, index) => ({
      rank: (parseInt(page) - 1) * parseInt(limit) + index + 1,
      user: {
        id: user.id,
        username: user.username
      },
      stats: {
        totalPoints: user.totalPoints,
        totalPicks: user.totalPicks,
        correctPicks: user.correctPicks,
        accuracy: user.totalPicks > 0 
          ? ((user.correctPicks / user.totalPicks) * 100).toFixed(1)
          : '0.0',
        eventsParticipated: user.eventsParticipated,
        bestEventScore: user.bestEventScore,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      }
    }));

    res.json({
      leaderboard,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(count / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < count,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/event/:eventId
// @desc    Get event-specific leaderboard
// @access  Public
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    // Get event details
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get all picks for this event that have been scored
    const { count, rows: picks } = await Pick.findAndCountAll({
      where: { 
        event_id: eventId, 
        isSubmitted: true,
        isScored: true 
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }],
      order: [['totalPoints', 'DESC'], ['correctPicks', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Calculate rankings
    const leaderboard = picks.map((pick, index) => ({
      rank: (parseInt(page) - 1) * parseInt(limit) + index + 1,
      user: {
        id: pick.user.id,
        username: pick.user.username
      },
      stats: {
        totalPoints: pick.totalPoints,
        correctPicks: pick.correctPicks,
        totalPicks: pick.picks.length,
        accuracy: pick.picks.length > 0 
          ? ((pick.correctPicks / pick.picks.length) * 100).toFixed(1)
          : '0.0'
      },
      submittedAt: pick.createdAt
    }));

    res.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        status: event.status
      },
      leaderboard,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(count / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < count,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get event leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/user/:userId
// @desc    Get user's ranking and stats
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate global rank with tie-breaker on correctPicks then totalPicks
    const usersOrdered = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'totalPoints', 'correctPicks', 'totalPicks'],
      order: [
        ['totalPoints', 'DESC'],
        ['correctPicks', 'DESC'],
        ['totalPicks', 'DESC']
      ]
    });
    const index = usersOrdered.findIndex(u => u.id === user.id);
    const globalRank = index === -1 ? usersOrdered.length : index;

    // Get user's recent picks
    const recentPicks = await Pick.findAll({
      where: { user_id: userId },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['id', 'name', 'date', 'status']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      user: {
        id: user.id,
        username: user.username
      },
      stats: {
        globalRank: globalRank + 1,
        totalPoints: user.totalPoints,
        totalPicks: user.totalPicks,
        correctPicks: user.correctPicks,
        accuracy: user.totalPicks > 0 
          ? ((user.correctPicks / user.totalPicks) * 100).toFixed(1)
          : '0.0',
        eventsParticipated: user.eventsParticipated,
        bestEventScore: user.bestEventScore,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      },
      recentPicks
    });
  } catch (error) {
    console.error('Get user ranking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/stats
// @desc    Get leaderboard statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Get total number of active users
    const totalUsers = await User.count({ where: { isActive: true } });

    // Get total number of events
    const totalEvents = await Event.count({ where: { isActive: true } });

    // Get total number of picks submitted
    const totalPicks = await Pick.count({ where: { isSubmitted: true } });

    // Get average points per user
    const avgPointsResult = await User.findAll({
      where: { isActive: true },
      attributes: [[fn('AVG', col('totalPoints')), 'avgPoints']],
      raw: true
    });
    const avgPoints = avgPointsResult.length > 0 ? Math.round(avgPointsResult[0].avgPoints || 0) : 0;

    // Get top 3 users
    const topUsers = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'username', 'totalPoints'],
      order: [['totalPoints', 'DESC']],
      limit: 3
    });

    res.json({
      totalUsers,
      totalEvents,
      totalPicks,
      avgPoints,
      topUsers: topUsers.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        totalPoints: user.totalPoints
      }))
    });
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 