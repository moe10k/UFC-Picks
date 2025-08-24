#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script runs the database restructuring migration with proper error handling.
 * It can be used to migrate up (restructure) or down (rollback).
 */

const migration = require('./migrations/001_restructure_database');
const { sequelize, testConnection } = require('./config/database');

async function runMigration() {
  const command = process.argv[2];
  
  if (!command || !['up', 'down'].includes(command)) {
    console.log('❌ Usage: node run-migration.js <up|down>');
    console.log('   up   - Run migration (restructure database)');
    console.log('   down - Rollback migration (restore old structure)');
    process.exit(1);
  }
  
  try {
    console.log('🔍 Testing database connection...');
    await testConnection();
    
    console.log(`🚀 Running migration: ${command.toUpperCase()}`);
    
    if (command === 'up') {
      await migration.up();
      console.log('✅ Migration completed successfully!');
    } else {
      await migration.down();
      console.log('✅ Rollback completed successfully!');
    }
    
    console.log('🔍 Verifying database structure...');
    
    if (command === 'up') {
      // Verify new tables exist
      const tables = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('fights', 'pick_details', 'user_stats')
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (tables.length === 3) {
        console.log('✅ All new tables created successfully');
      } else {
        console.log('⚠️  Some new tables may be missing');
      }
      
      // Verify old columns are removed
      const eventsColumns = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'events' 
        AND COLUMN_NAME = 'fights'
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (eventsColumns.length === 0) {
        console.log('✅ Old fights column removed from events table');
      } else {
        console.log('⚠️  Old fights column still exists');
      }
      
    } else {
      // Verify old structure is restored
      const eventsColumns = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'events' 
        AND COLUMN_NAME = 'fights'
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (eventsColumns.length > 0) {
        console.log('✅ Old fights column restored to events table');
      } else {
        console.log('⚠️  Old fights column not restored');
      }
    }
    
    console.log('🎉 Migration process completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('💡 Check the error details above and fix any issues');
    console.error('💡 You can run the migration again or contact support');
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Migration interrupted by user');
  try {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Migration terminated');
  try {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  process.exit(0);
});

// Run the migration
runMigration().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
