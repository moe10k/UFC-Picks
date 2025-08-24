const User = require('./User');
const Event = require('./Event');
const Fight = require('./Fight');
const Pick = require('./Pick');
const PickDetail = require('./PickDetail');
const UserStats = require('./UserStats');

// Set up associations after all models are loaded
function setupAssociations() {
  // Guard against multiple calls
  if (User.associations && Object.keys(User.associations).length > 0) {
    console.log('⚠️  Associations already set up, skipping...');
    return;
  }

  // User associations
  User.hasMany(Pick, { 
    foreignKey: 'user_id', 
    as: 'picks',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  User.hasOne(UserStats, {
    foreignKey: 'user_id',
    as: 'stats',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Event associations
  Event.hasMany(Fight, {
    foreignKey: 'event_id',
    as: 'fights',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  Event.hasMany(Pick, { 
    foreignKey: 'event_id', 
    as: 'eventPicks',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Fight associations
  Fight.belongsTo(Event, {
    foreignKey: 'event_id',
    as: 'event',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  Fight.hasMany(PickDetail, {
    foreignKey: 'fight_id',
    as: 'pickDetails',
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
  
  Pick.hasMany(PickDetail, {
    foreignKey: 'pick_id',
    as: 'pickDetails',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // PickDetail associations
  PickDetail.belongsTo(Pick, {
    foreignKey: 'pick_id',
    as: 'pick',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  PickDetail.belongsTo(Fight, {
    foreignKey: 'fight_id',
    as: 'fight',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // UserStats associations
  UserStats.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
}

module.exports = setupAssociations;
