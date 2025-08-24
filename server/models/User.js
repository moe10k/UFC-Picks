const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isOwner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    afterCreate: async (user) => {
      try {
        // Import UserStats model dynamically to avoid circular dependencies
        const UserStats = require('./UserStats');
        
        // Create default UserStats for new user
        await UserStats.create({
          userId: user.id,
          totalPicks: 0,
          correctPicks: 0,
          totalPoints: 0,
          eventsParticipated: 0,
          bestEventScore: 0,
          currentStreak: 0,
          longestStreak: 0,
          averageAccuracy: 0.00
        });
        
        console.log(`✅ Auto-created UserStats for new user: ${user.username}`);
      } catch (error) {
        console.error(`❌ Failed to create UserStats for user ${user.username}:`, error.message);
        // Don't throw error - user creation should still succeed even if stats creation fails
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for display name
User.prototype.getDisplayName = function() {
  return `@${this.username}`;
};

module.exports = User; 