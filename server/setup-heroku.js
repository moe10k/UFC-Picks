#!/usr/bin/env node

const { sequelize } = require('./config/database');
const User = require('./models/User');
const Event = require('./models/Event');
const Pick = require('./models/Pick');

console.log('🚀 Setting up UFC Picks database on Heroku...');
console.log('');

const setupDatabase = async () => {
  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Sync all models
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: false }); // Don't force, preserve existing data
    console.log('✅ Database models synced successfully!');
    
    // Check if we need to seed initial data
    const userCount = await User.count();
    const eventCount = await Event.count();
    
    console.log(`📊 Current database state:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Events: ${eventCount}`);
    
    if (userCount === 0) {
      console.log('🌱 No users found. You may want to create an admin user.');
      console.log('💡 Use: heroku run npm run db:create-admin');
    }
    
    if (eventCount === 0) {
      console.log('🌱 No events found. You may want to seed some events.');
      console.log('💡 Use: heroku run npm run db:seed');
    }
    
    console.log('');
    console.log('🎉 Heroku database setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Create an admin user: heroku run npm run db:create-admin');
    console.log('   2. Seed events: heroku run npm run db:seed');
    console.log('   3. Check database status: heroku run npm run db:status');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check if DATABASE_URL is set: heroku config:get DATABASE_URL');
    console.log('   2. Make sure you have a database addon:');
    console.log('      heroku addons:create jawsdb:mini');
    console.log('      or');
    console.log('      heroku addons:create heroku-postgresql:mini');
    console.log('   3. Set NODE_ENV: heroku config:set NODE_ENV=production');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run setup
setupDatabase();
