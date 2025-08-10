#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

const { sequelize } = require('./config/database');
const Event = require('./models/Event');
const seedData = require('./utils/seedData');

async function fixCorruptedEvents() {
  try {
    console.log('🔧 Fixing corrupted events data...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection: OK');
    
    // Get all events
    const events = await Event.findAll();
    console.log(`📊 Found ${events.length} events`);
    
    if (events.length === 0) {
      console.log('ℹ️  No events found, running full seed...');
      await seedData();
      return;
    }
    
    // Check each event for corrupted fights data
    let corruptedCount = 0;
    for (const event of events) {
      try {
        // Try to access the fights data
        const fights = event.fights;
        if (Array.isArray(fights)) {
          console.log(`✅ Event "${event.name}" has valid fights data (${fights.length} fights)`);
        } else {
          console.log(`⚠️  Event "${event.name}" has invalid fights data type: ${typeof fights}`);
          corruptedCount++;
        }
      } catch (error) {
        console.log(`❌ Event "${event.name}" has corrupted fights data: ${error.message}`);
        corruptedCount++;
      }
    }
    
    if (corruptedCount > 0) {
      console.log(`\n🔧 Found ${corruptedCount} corrupted events. Fixing...`);
      
      // Clear all events and re-seed
      await Event.destroy({ where: {} });
      console.log('✅ Cleared all events');
      
      // Re-seed with clean data
      console.log('🌱 Re-seeding events...');
      await seedData();
      console.log('✅ Events re-seeded successfully!');
    } else {
      console.log('✅ All events have valid data!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing corrupted events:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixCorruptedEvents();
}

module.exports = fixCorruptedEvents;
