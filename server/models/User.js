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
  },
  // Stats fields
  totalPicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  correctPicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  eventsParticipated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bestEventScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  longestStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'users',
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
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for accuracy percentage
User.prototype.getAccuracy = function() {
  if (this.totalPicks === 0) return 0;
  return ((this.correctPicks / this.totalPicks) * 100).toFixed(1);
};

// Virtual for display name
User.prototype.getDisplayName = function() {
  return `@${this.username}`;
};

// Get user stats as an object (for API compatibility)
User.prototype.getStats = function() {
  return {
    totalPicks: this.totalPicks,
    correctPicks: this.correctPicks,
    totalPoints: this.totalPoints,
    eventsParticipated: this.eventsParticipated,
    bestEventScore: this.bestEventScore,
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak
  };
};

module.exports = User; 