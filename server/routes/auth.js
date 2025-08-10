const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom((value) => {
      const reservedUsernames = ['admin', 'administrator', 'root', 'system', 'user', 'test', 'guest', 'anonymous'];
      if (reservedUsernames.includes(value.toLowerCase())) {
        throw new Error('Username is reserved and cannot be used');
      }
      return true;
    }),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;
    
    console.log('Attempting to create user:', { username, email, passwordLength: password.length });
    
    // Normalize email and username (trim whitespace and convert to lowercase for comparison)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // Check if email already exists (case-insensitive)
    const existingEmail = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')), 
        normalizedEmail
      )
    });

    if (existingEmail) {
      return res.status(400).json({
        message: 'Email already registered'
      });
    }

    // Check if username already exists (case-insensitive)
    const existingUsername = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('username')), 
        normalizedUsername
      )
    });

    if (existingUsername) {
      return res.status(400).json({
        message: 'Username already taken'
      });
    }

    // Create new user with normalized values
    const user = await User.create({
      username: username.trim(),
      email: email.trim(),
      password
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        stats: user.getStats()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle database constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.fields ? Object.keys(error.fields)[0] : 'unknown';
      if (field === 'email') {
        return res.status(400).json({ message: 'Email already registered' });
      } else if (field === 'username') {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   GET /api/auth/check-availability
// @desc    Check if username or email is available
// @access  Public
router.get('/check-availability', async (req, res) => {
  try {
    const { username, email } = req.query;
    const result = {};

    if (username) {
      const normalizedUsername = username.trim().toLowerCase();
      const existingUsername = await User.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('username')), 
          normalizedUsername
        )
      });
      result.username = {
        available: !existingUsername,
        message: existingUsername ? 'Username already taken' : 'Username available'
      };
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('email')), 
          normalizedEmail
        )
      });
      result.email = {
        available: !existingEmail,
        message: existingEmail ? 'Email already registered' : 'Email available'
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Server error checking availability' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('emailOrUsername')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array());
      console.log('Login request body:', req.body);
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { emailOrUsername, password } = req.body;
    
    console.log('Login attempt for:', emailOrUsername);

    // Find user by email or username (case-insensitive)
    const user = await User.findOne({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('email')), 
            sequelize.fn('LOWER', emailOrUsername)
          ),
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('username')), 
            sequelize.fn('LOWER', emailOrUsername)
          )
        ]
      }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        stats: user.getStats()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
        stats: req.user.getStats(),
        isAdmin: req.user.isAdmin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { avatar } = req.body;
    const updateFields = {};

    if (avatar) updateFields.avatar = avatar;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update(updateFields);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        stats: user.getStats()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .isLength({ max: 128 })
    .withMessage('New password must not exceed 128 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Add role filter
    if (role === 'admin') {
      whereClause.isAdmin = true;
    } else if (role === 'user') {
      whereClause.isAdmin = false;
      whereClause.isOwner = false;
    } else if (role === 'owner') {
      whereClause.isOwner = true;
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        isOwner: user.isOwner,
        isActive: user.isActive,
        createdAt: user.createdAt,
        stats: user.getStats()
      })),
      pagination: {
        current: parseInt(page),
        total: totalPages,
        totalUsers: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   PUT /api/auth/users/:userId/role
// @desc    Update user role (admin only)
// @access  Admin
router.put('/users/:userId/role', adminAuth, [
  body('isAdmin')
    .isBoolean()
    .withMessage('isAdmin must be a boolean value')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { isAdmin } = req.body;
    const adminUser = req.user;

    // Prevent admin from removing their own admin role
    if (parseInt(userId) === adminUser.id && !isAdmin) {
      return res.status(400).json({ 
        message: 'You cannot remove your own administrator privileges' 
      });
    }

    // Find the target user
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent modifying owner accounts (only owners can modify other owners)
    if (targetUser.isOwner && !adminUser.isOwner) {
      return res.status(403).json({ 
        message: 'Only the owner can modify owner accounts' 
      });
    }

    // Prevent owners from being demoted to regular users
    if (targetUser.isOwner && !isAdmin) {
      return res.status(400).json({ 
        message: 'Owner accounts cannot be demoted to regular users' 
      });
    }

    // Prevent deactivating the last admin (excluding owners)
    if (!isAdmin && targetUser.isAdmin && !targetUser.isOwner) {
      const adminCount = await User.count({ 
        where: { 
          isAdmin: true,
          isOwner: false 
        } 
      });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot remove the last administrator. At least one admin must remain.' 
        });
      }
    }

    // Update the user's role
    await targetUser.update({ isAdmin });

    // Log the action for audit purposes
    console.log(`Admin ${adminUser.username} (ID: ${adminUser.id}) ${isAdmin ? 'granted' : 'revoked'} admin privileges for user ${targetUser.username} (ID: ${targetUser.id})`);

    res.json({
      message: `Successfully ${isAdmin ? 'granted' : 'revoked'} administrator privileges for ${targetUser.username}`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        avatar: targetUser.avatar,
        isAdmin: targetUser.isAdmin,
        isOwner: targetUser.isOwner,
        isActive: targetUser.isActive,
        createdAt: targetUser.createdAt,
        stats: targetUser.getStats()
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// @route   PUT /api/auth/users/:userId/status
// @desc    Update user status (active/inactive) (admin only)
// @access  Admin
router.put('/users/:userId/status', adminAuth, [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { isActive } = req.body;
    const adminUser = req.user;

    // Prevent admin from deactivating their own account
    if (parseInt(userId) === adminUser.id && !isActive) {
      return res.status(400).json({ 
        message: 'You cannot deactivate your own account' 
      });
    }

    // Find the target user
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating owner accounts
    if (targetUser.isOwner && !isActive) {
      return res.status(400).json({ 
        message: 'Owner accounts cannot be deactivated' 
      });
    }

    // Prevent deactivating the last active admin (excluding owners)
    if (!isActive && targetUser.isAdmin && !targetUser.isOwner) {
      const adminCount = await User.count({ 
        where: { 
          isAdmin: true, 
          isActive: true,
          isOwner: false 
        } 
      });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot deactivate the last active administrator. At least one admin must remain active.' 
        });
      }
    }

    // Update the user's status
    await targetUser.update({ isActive });

    // Log the action for audit purposes
    console.log(`Admin ${adminUser.username} (ID: ${adminUser.id}) ${isActive ? 'activated' : 'deactivated'} user ${targetUser.username} (ID: ${targetUser.id})`);

    res.json({
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} account for ${targetUser.username}`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        avatar: targetUser.avatar,
        isAdmin: targetUser.isAdmin,
        isOwner: targetUser.isOwner,
        isActive: targetUser.isActive,
        createdAt: targetUser.createdAt,
        stats: targetUser.getStats()
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// @route   GET /api/auth/users/stats
// @desc    Get user statistics (admin only)
// @access  Admin
router.get('/users/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { isAdmin: true, isOwner: false } });
    const ownerUsers = await User.count({ where: { isOwner: true } });
    const activeUsers = await User.count({ where: { isActive: true } });
    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    res.json({
      stats: {
        totalUsers,
        adminUsers,
        ownerUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentUsers,
        adminPercentage: totalUsers > 0 ? (((adminUsers + ownerUsers) / totalUsers) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error fetching user statistics' });
  }
});

module.exports = router; 