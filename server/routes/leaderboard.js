const express = require('express');
const { Op, fn, col } = require('sequelize');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const Pick = require('../models/Pick');
const Event = require('../models/Event');

const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get global leaderboard
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    // Get users with their stats from UserStats table, sorted by total points
    const { count, rows: userStats } = await UserStats.findAndCountAll({
      include: [{
        model: User,
        as: 'user',
        where: { isActive: true },
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['totalPoints', 'DESC'], ['correctPicks', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Transform data for frontend
    const leaderboard = userStats.map((stats, index) => ({
      rank: (parseInt(page) - 1) * parseInt(limit) + index + 1,
      user: {
        id: stats.user.id,
        username: stats.user.username,
        avatar: stats.user.avatar
      },
      stats: {
        totalPoints: stats.totalPoints,
        totalPicks: stats.totalPicks,
        correctPicks: stats.correctPicks,
        accuracy: stats.getAccuracy(),
        averageAccuracy: stats.getAccuracyDecimal(),
        eventsParticipated: stats.eventsParticipated,
        bestEventScore: stats.bestEventScore,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak
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

    // Get picks for this specific event, sorted by points
    const { count, rows: picks } = await Pick.findAndCountAll({
      where: { 
        event_id: eventId,
        isScored: true
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { isActive: true },
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['totalPoints', 'DESC'], ['correctPicks', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Transform data for frontend
    const leaderboard = picks.map((pick, index) => ({
      rank: (parseInt(page) - 1) * parseInt(limit) + index + 1,
      user: {
        id: pick.user.id,
        username: pick.user.username,
        avatar: pick.user.avatar
      },
      stats: {
        totalPoints: pick.totalPoints,
        totalPicks: pick.totalPicks,
        correctPicks: pick.correctPicks,
        accuracy: pick.getAccuracy(),
        submittedAt: pick.submittedAt
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
    console.error('Get event leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/user/:userId
// @desc    Get user's leaderboard position and stats
// @access  Private
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's stats
    const userStats = await UserStats.findOne({
      where: { userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    if (!userStats) {
      return res.status(404).json({ message: 'User stats not found' });
    }

    // Get user's global rank
    const globalRank = await UserStats.count({
      where: {
        totalPoints: { [Op.gt]: userStats.totalPoints }
      }
    });

    // Get user's rank in their events participated
    const eventsRank = await UserStats.count({
      where: {
        eventsParticipated: { [Op.gt]: userStats.eventsParticipated }
      }
    });

    // Get user's recent picks
    const recentPicks = await Pick.findAll({
      where: { userId },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'date']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      user: {
        id: userStats.user.id,
        username: userStats.user.username,
        avatar: userStats.user.avatar
      },
      stats: {
        totalPoints: userStats.totalPoints,
        totalPicks: userStats.totalPicks,
        correctPicks: userStats.correctPicks,
        accuracy: userStats.getAccuracy(),
        averageAccuracy: userStats.getAccuracyDecimal(),
        eventsParticipated: userStats.eventsParticipated,
        bestEventScore: userStats.bestEventScore,
        currentStreak: userStats.currentStreak,
        longestStreak: userStats.longestStreak
      },
      rankings: {
        global: globalRank + 1,
        events: eventsRank + 1
      },
      recentPicks: recentPicks.map(pick => ({
        id: pick.id,
        event: pick.event,
        totalPoints: pick.totalPoints,
        correctPicks: pick.correctPicks,
        totalPicks: pick.totalPicks,
        submittedAt: pick.submittedAt
      }))
    });
  } catch (error) {
    console.error('Get user leaderboard position error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/stats
// @desc    Get leaderboard statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Get overall statistics
    const totalUsers = await UserStats.count();
    const totalPicks = await UserStats.sum('totalPicks') || 0;
    const totalPoints = await UserStats.sum('totalPoints') || 0;
    const averageAccuracy = await UserStats.findOne({
      attributes: [
        [fn('AVG', col('average_accuracy')), 'avgAccuracy']
      ]
    });

    // Get top performers
    const topPoints = await UserStats.findOne({
      include: [{
        model: User,
        as: 'user',
        attributes: ['username']
      }],
      order: [['totalPoints', 'DESC']]
    });

    const topAccuracy = await UserStats.findOne({
      include: [{
        model: User,
        as: 'user',
        attributes: ['username']
      }],
      where: {
        totalPicks: { [Op.gte]: 5 } // Minimum 5 picks to qualify
      },
      order: [['averageAccuracy', 'DESC']]
    });

    const topStreak = await UserStats.findOne({
      include: [{
        model: User,
        as: 'user',
        attributes: ['username']
      }],
      order: [['longestStreak', 'DESC']]
    });

    res.json({
      overall: {
        totalUsers,
        totalPicks,
        totalPoints,
        averageAccuracy: averageAccuracy?.dataValues?.avgAccuracy || 0
      },
      topPerformers: {
        mostPoints: topPoints ? {
          username: topPoints.user.username,
          points: topPoints.totalPoints
        } : null,
        bestAccuracy: topAccuracy ? {
          username: topAccuracy.user.username,
          accuracy: topAccuracy.getAccuracy()
        } : null,
        longestStreak: topStreak ? {
          username: topStreak.user.username,
          streak: topStreak.longestStreak
        } : null
      }
    });
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 