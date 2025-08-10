const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// SQLite connection for reading existing data
const sqliteSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

// PostgreSQL connection for writing new data
const postgresSequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Import models
const User = require('../models/User');
const Event = require('../models/Event');
const Pick = require('../models/Pick');

// Define models for SQLite (without hooks to avoid password re-hashing)
const SqliteUser = sqliteSequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: Sequelize.STRING(30),
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  avatar: Sequelize.STRING,
  isAdmin: Sequelize.BOOLEAN,
  isOwner: Sequelize.BOOLEAN,
  isActive: Sequelize.BOOLEAN,
  totalPicks: Sequelize.INTEGER,
  correctPicks: Sequelize.INTEGER,
  totalPoints: Sequelize.INTEGER,
  eventsParticipated: Sequelize.INTEGER,
  bestEventScore: Sequelize.INTEGER,
  currentStreak: Sequelize.INTEGER,
  longestStreak: Sequelize.INTEGER,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
}, {
  tableName: 'users'
});

const SqliteEvent = sqliteSequelize.define('Event', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  date: Sequelize.DATE,
  location: Sequelize.STRING,
  isActive: Sequelize.BOOLEAN,
  isCompleted: Sequelize.BOOLEAN,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
}, {
  tableName: 'events'
});

const SqlitePick = sqliteSequelize.define('Pick', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: Sequelize.INTEGER,
  eventId: Sequelize.INTEGER,
  fighterName: Sequelize.STRING,
  method: Sequelize.STRING,
  round: Sequelize.INTEGER,
  isCorrect: Sequelize.BOOLEAN,
  points: Sequelize.INTEGER,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
}, {
  tableName: 'picks'
});

const migrateData = async () => {
  try {
    console.log('🚀 Starting migration from SQLite to PostgreSQL...');
    
    // Test connections
    await sqliteSequelize.authenticate();
    console.log('✅ SQLite connection established');
    
    await postgresSequelize.authenticate();
    console.log('✅ PostgreSQL connection established');
    
    // Sync PostgreSQL database (create tables)
    console.log('📋 Creating PostgreSQL tables...');
    await postgresSequelize.sync({ force: true });
    console.log('✅ PostgreSQL tables created');
    
    // Migrate Users
    console.log('👥 Migrating users...');
    const users = await SqliteUser.findAll();
    for (const user of users) {
      await User.create({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password, // Already hashed
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        isOwner: user.isOwner,
        isActive: user.isActive,
        totalPicks: user.totalPicks,
        correctPicks: user.correctPicks,
        totalPoints: user.totalPoints,
        eventsParticipated: user.eventsParticipated,
        bestEventScore: user.bestEventScore,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // Migrate Events
    console.log('🏆 Migrating events...');
    const events = await SqliteEvent.findAll();
    for (const event of events) {
      await Event.create({
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        isActive: event.isActive,
        isCompleted: event.isCompleted,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      });
    }
    console.log(`✅ Migrated ${events.length} events`);
    
    // Migrate Picks
    console.log('🎯 Migrating picks...');
    const picks = await SqlitePick.findAll();
    for (const pick of picks) {
      await Pick.create({
        id: pick.id,
        userId: pick.userId,
        eventId: pick.eventId,
        fighterName: pick.fighterName,
        method: pick.method,
        round: pick.round,
        isCorrect: pick.isCorrect,
        points: pick.points,
        createdAt: pick.createdAt,
        updatedAt: pick.updatedAt
      });
    }
    console.log(`✅ Migrated ${picks.length} picks`);
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Picks: ${picks.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sqliteSequelize.close();
    await postgresSequelize.close();
    console.log('🔌 Database connections closed');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
