const User = require('./User');
const Event = require('./Event');
const Pick = require('./Pick');

// Set up associations after all models are loaded
function setupAssociations() {
  // User associations
  User.hasMany(Pick, { 
    foreignKey: 'user_id', 
    as: 'picks',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Event associations
  Event.hasMany(Pick, { 
    foreignKey: 'event_id', 
    as: 'picks',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Pick associations
  Pick.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  Pick.belongsTo(Event, { 
    foreignKey: 'event_id', 
    as: 'event',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
}

module.exports = setupAssociations;
