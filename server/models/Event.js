const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  venueName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  venueCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  venueState: {
    type: DataTypes.STRING,
    allowNull: true
  },
  venueCountry: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'live', 'completed'),
    defaultValue: 'upcoming'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pickDeadline: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'events',
  timestamps: true,
  indexes: [
    {
      fields: ['date', 'status']
    },
    {
      fields: ['status', 'is_active']
    },
    {
      fields: ['pick_deadline']
    },
    {
      fields: ['venue_city', 'venue_country']
    }
  ]
});

// Instance methods
Event.prototype.isUpcoming = function() {
  return this.date > new Date() && this.status === 'upcoming';
};

Event.prototype.getFormattedDate = function() {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get venue as object (for API compatibility)
Event.prototype.getVenue = function() {
  return {
    name: this.venueName,
    city: this.venueCity,
    state: this.venueState,
    country: this.venueCountry
  };
};

module.exports = Event; 