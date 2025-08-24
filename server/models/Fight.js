const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fight = sequelize.define('Fight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  fightNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'fight_number'
  },
  weightClass: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'weight_class'
  },
  isMainCard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_main_card'
  },
  isMainEvent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_main_event'
  },
  isCoMainEvent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_co_main_event'
  },
  fighter1Name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'fighter1_name'
  },
  fighter2Name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'fighter2_name'
  },
  fighter1Nick: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fighter1_nick'
  },
  fighter2Nick: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fighter2_nick'
  },
  fighter1Image: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fighter1_image'
  },
  fighter2Image: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fighter2_image'
  },
  fighter1Record: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fighter1_record'
  },
  fighter2Record: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fighter2_record'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  },
  winner: {
    type: DataTypes.ENUM('fighter1', 'fighter2', 'draw', 'no_contest'),
    allowNull: true
  },
  method: {
    type: DataTypes.ENUM('KO/TKO', 'Submission', 'Decision', 'Draw', 'No Contest'),
    allowNull: true
  },
  round: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'fights',
  timestamps: true,
  indexes: [
    {
      fields: ['event_id', 'fight_number'],
      unique: true
    },
    {
      fields: ['event_id']
    },
    {
      fields: ['weight_class']
    },
    {
      fields: ['is_main_card']
    },
    {
      fields: ['is_completed']
    },
    {
      fields: ['fighter1_name']
    },
    {
      fields: ['fighter2_name']
    }
  ]
});

// Instance methods
Fight.prototype.getFighter1 = function() {
  return {
    name: this.fighter1Name,
    nickname: this.fighter1Nick,
    image: this.fighter1Image,
    record: this.fighter1Record
  };
};

Fight.prototype.getFighter2 = function() {
  return {
    name: this.fighter2Name,
    nickname: this.fighter2Nick,
    image: this.fighter2Image,
    record: this.fighter2Record
  };
};

Fight.prototype.getResult = function() {
  if (!this.isCompleted) return null;
  
  return {
    winner: this.winner,
    method: this.method,
    round: this.round,
    time: this.time
  };
};

Fight.prototype.getIsMainCard = function() {
  return this.isMainCard;
};

Fight.prototype.getIsMainEvent = function() {
  return this.isMainEvent;
};

Fight.prototype.getIsCoMainEvent = function() {
  return this.isCoMainEvent;
};

module.exports = Fight;
