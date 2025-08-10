// Load environment variables first
require('dotenv').config();

const seedData = require('./utils/seedData');

async function runSeed() {
  try {
    console.log('🌱 Starting database seeding...');
    await seedData();
    console.log('✅ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
