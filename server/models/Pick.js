const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Event = require('./Event');

const Pick = sequelize.define('Pick', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event,
      key: 'id'
    }
  },
  // Store picks as JSON
  picks: {
    type: DataTypes.TEXT, // JSON string
    allowNull: false,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('picks');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('picks', JSON.stringify(value));
    }
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  correctPicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isScored: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scoredAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'picks',
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
    }
  ]
});

// Associations
Pick.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Pick.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Instance methods
Pick.prototype.getAccuracy = function() {
  if (this.picks.length === 0) return '0%';
  return `${((this.correctPicks / this.picks.length) * 100).toFixed(1)}%`;
};

module.exports = Pick; 