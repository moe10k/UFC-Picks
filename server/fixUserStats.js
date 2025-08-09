#!/usr/bin/env node

/**
 * Standalone script to fix user statistics by recalculating them from scratch
 * Run this script to fix any incorrect totals that may have accumulated
 * 
 * Usage: node fixUserStats.js
 */

const { sequelize } = require('./config/database');
const { recalculateAllUserStats } = require('./utils/recalculateUserStats');

async function main() {
  try {
    console.log('🚀 Starting user statistics fix script...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run the recalculation
    const result = await recalculateAllUserStats();
    
    if (result.success) {
      console.log(`\n🎉 Script completed successfully!`);
      console.log(`📊 ${result.usersUpdated} users had their statistics updated`);
    } else {
      console.log(`\n❌ Script failed: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = main;
