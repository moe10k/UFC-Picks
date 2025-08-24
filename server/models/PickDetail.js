const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PickDetail = sequelize.define('PickDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pickId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'pick_id',
    references: {
      model: 'picks',
      key: 'id'
    }
  },
  fightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'fight_id',
    references: {
      model: 'fights',
      key: 'id'
    }
  },
  predictedWinner: {
    type: DataTypes.ENUM('fighter1', 'fighter2'),
    allowNull: false,
    field: 'predicted_winner'
  },
  predictedMethod: {
    type: DataTypes.ENUM('KO/TKO', 'Submission', 'Decision'),
    allowNull: false,
    field: 'predicted_method'
  },
  predictedRound: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'predicted_round',
    validate: {
      min: 1,
      max: 5
    }
  },
  predictedTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'predicted_time'
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'points_earned'
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_correct'
  },
  scoredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'scored_at'
  }
}, {
  tableName: 'pick_details',
  timestamps: true,
  indexes: [
    {
      fields: ['pick_id', 'fight_id'],
      unique: true
    },
    {
      fields: ['pick_id']
    },
    {
      fields: ['fight_id']
    },
    {
      fields: ['is_correct']
    },
    {
      fields: ['points_earned']
    }
  ]
});

// Instance methods
PickDetail.prototype.getPrediction = function() {
  return {
    winner: this.predictedWinner,
    method: this.predictedMethod,
    round: this.predictedRound,
    time: this.predictedTime
  };
};

PickDetail.prototype.isDecision = function() {
  return this.predictedMethod === 'Decision';
};

PickDetail.prototype.isFinish = function() {
  return this.predictedMethod === 'KO/TKO' || this.predictedMethod === 'Submission';
};

PickDetail.prototype.getPoints = function() {
  return this.pointsEarned || 0;
};

module.exports = PickDetail;
