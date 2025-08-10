#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

const { sequelize } = require('./config/database');
const User = require('./models/User');
const Event = require('./models/Event');
const Pick = require('./models/Pick');
const seedData = require('./utils/seedData');

const commands = {
  'status': async () => {
    try {
      console.log('📊 Database Status Check');
      console.log('========================');
      
      // Test connection
      await sequelize.authenticate();
      console.log('✅ Database connection: OK');
      
      // Check table counts
      const userCount = await User.count();
      const eventCount = await Event.count();
      const pickCount = await Pick.count();
      
      console.log(`👥 Users: ${userCount}`);
      console.log(`🥊 Events: ${eventCount}`);
      console.log(`📝 Picks: ${pickCount}`);
      
      // Check if admin user exists
      const adminUser = await User.findOne({ where: { email: 'admin@ufcpicks.com' } });
      if (adminUser) {
        console.log('👑 Admin user: EXISTS');
        console.log(`   Username: ${adminUser.username}`);
        console.log(`   Email: ${adminUser.email}`);
      } else {
        console.log('❌ Admin user: MISSING');
      }
      
    } catch (error) {
      console.error('❌ Database status check failed:', error.message);
    }
  },
  
  'seed': async () => {
    try {
      console.log('🌱 Seeding Database...');
      await seedData();
      console.log('✅ Database seeding completed!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error.message);
    }
  },
  
  'reset': async () => {
    try {
      console.log('⚠️  WARNING: This will delete ALL data!');
      console.log('Press Ctrl+C to cancel or any key to continue...');
      
      // Wait for user input (simple timeout-based approach)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🔄 Resetting database...');
      
      // Drop all tables and recreate
      await sequelize.sync({ force: true });
      console.log('✅ Database reset completed');
      
      // Re-seed with sample data
      console.log('🌱 Re-seeding database...');
      await seedData();
      console.log('✅ Database reset and seeding completed!');
      
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
    }
  },
  
  'create-admin': async () => {
    try {
      console.log('👑 Creating Admin User...');
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ where: { email: 'admin@ufcpicks.com' } });
      if (existingAdmin) {
        console.log('ℹ️  Admin user already exists');
        return;
      }
      
      // Create admin user with temporary password
      const tempPassword = 'temp' + Math.random().toString(36).substring(2, 8);
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@ufcpicks.com',
        password: tempPassword,
        isAdmin: true,
        isOwner: true
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Temporary Password: ${tempPassword}`);
      console.log('   ⚠️  Please change this password immediately after first login!');
      
    } catch (error) {
      console.error('❌ Failed to create admin user:', error.message);
    }
  },
  
  'help': () => {
    console.log('🚀 UFC Picks Database Management');
    console.log('==================================');
    console.log('');
    console.log('Available commands:');
    console.log('  status     - Check database status and counts');
    console.log('  seed       - Seed database with sample data');
    console.log('  reset      - Reset database (WARNING: deletes all data)');
    console.log('  create-admin - Create admin user if missing');
    console.log('  help       - Show this help message');
    console.log('');
    console.log('Usage: node manage-database.js <command>');
    console.log('');
    console.log('Examples:');
    console.log('  node manage-database.js status');
    console.log('  node manage-database.js seed');
    console.log('  node manage-database.js reset');
  }
};

async function main() {
  const command = process.argv[2] || 'help';
  
  if (!commands[command]) {
    console.log(`❌ Unknown command: ${command}`);
    console.log('Run "node manage-database.js help" for available commands');
    process.exit(1);
  }
  
  try {
    await commands[command]();
  } catch (error) {
    console.error('❌ Command failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = commands;
