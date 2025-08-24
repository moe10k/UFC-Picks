const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pick = sequelize.define('Pick', {
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
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'event_id',
    references: {
      model: 'events',
      key: 'id'
    }
  },
  isSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_submitted'
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'submitted_at'
  },
  isScored: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_scored'
  },
  scoredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'scored_at'
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_points'
  },
  correctPicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'correct_picks'
  },
  totalPicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_picks'
  },
  accuracy: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'accuracy',
    get() {
      const value = this.getDataValue('accuracy');
      return value ? parseFloat(value) : 0;
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'picks',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'event_id'],
      unique: true
    },
    {
      fields: ['event_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_submitted']
    },
    {
      fields: ['is_scored']
    },
    {
      fields: ['total_points']
    },
    {
      fields: ['accuracy']
    }
  ],
  hooks: {
    beforeSave: async (pick) => {
      // Calculate accuracy if we have total picks
      if (pick.totalPicks > 0 && pick.correctPicks !== undefined) {
        pick.accuracy = parseFloat(((pick.correctPicks / pick.totalPicks) * 100).toFixed(2));
      } else {
        pick.accuracy = 0.00;
      }
    }
  }
});

// Instance methods
Pick.prototype.getAccuracy = function() {
  if (this.totalPicks === 0 || !this.accuracy) return '0%';
  return `${this.accuracy.toFixed(1)}%`;
};

Pick.prototype.getAccuracyDecimal = function() {
  return this.accuracy || 0;
};

Pick.prototype.isComplete = function() {
  return this.isSubmitted && this.isScored;
};

Pick.prototype.getScore = function() {
  return {
    totalPoints: this.totalPoints,
    correctPicks: this.correctPicks,
    totalPicks: this.totalPicks,
    accuracy: this.accuracy
  };
};

module.exports = Pick; 