const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserStats = sequelize.define('UserStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalPicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_picks'
  },
  correctPicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'correct_picks'
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_points'
  },
  eventsParticipated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'events_participated'
  },
  bestEventScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'best_event_score'
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_streak'
  },
  longestStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'longest_streak'
  },
  averageAccuracy: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'average_accuracy',
    get() {
      const value = this.getDataValue('averageAccuracy');
      return value ? parseFloat(value) : 0;
    }
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'last_updated',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_stats',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    },
    {
      fields: ['total_points']
    },
    {
      fields: ['average_accuracy']
    },
    {
      fields: ['events_participated']
    },
    {
      fields: ['current_streak']
    }
  ],
  hooks: {
    beforeSave: async (stats) => {
      // Calculate average accuracy
      if (stats.totalPicks > 0 && stats.correctPicks !== undefined) {
        stats.averageAccuracy = parseFloat(((stats.correctPicks / stats.totalPicks) * 100).toFixed(2));
      } else {
        stats.averageAccuracy = 0.00;
      }
      
      // Update last updated timestamp
      stats.lastUpdated = new Date();
    }
  }
});

// Instance methods
UserStats.prototype.getAccuracy = function() {
  if (this.totalPicks === 0 || !this.averageAccuracy) return '0%';
  return `${this.averageAccuracy.toFixed(1)}%`;
};

UserStats.prototype.getAccuracyDecimal = function() {
  return this.averageAccuracy || 0;
};

UserStats.prototype.getStats = function() {
  return {
    totalPicks: this.totalPicks,
    correctPicks: this.correctPicks,
    totalPoints: this.totalPoints,
    eventsParticipated: this.eventsParticipated,
    bestEventScore: this.bestEventScore,
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak,
    averageAccuracy: this.averageAccuracy
  };
};

UserStats.prototype.updateStats = function(newStats) {
  Object.assign(this, newStats);
  return this.save();
};

module.exports = UserStats;
