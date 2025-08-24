const { sequelize } = require('./config/database');
const Event = require('./models/Event');
const Pick = require('./models/Pick');

async function testCleanup() {
  try {
    console.log('🧪 Testing event deletion and cleanup functionality...\n');
    
    // Test 1: Check current events and picks
    console.log('📊 Current database state:');
    const events = await Event.findAll();
    const picks = await Pick.findAll();
    
    console.log(`- Events: ${events.length}`);
    console.log(`- Picks: ${picks.length}`);
    
    if (events.length > 0) {
      console.log('\n📅 Active events:');
      events.forEach(event => {
        console.log(`  - ${event.name} (ID: ${event.id}, Status: ${event.status}, Active: ${event.isActive})`);
      });
    }
    
    if (picks.length > 0) {
      console.log('\n🎯 Picks:');
      picks.forEach(pick => {
        console.log(`  - User ${pick.userId} -> Event ${pick.eventId} (${pick.totalPicks} picks)`);
      });
    }
    
    // Test 2: Check for orphaned picks
    console.log('\n🔍 Checking for orphaned picks...');
    const orphanedPicks = await Pick.findAll({
      include: [{
        model: Event,
        as: 'event',
        where: { isActive: false }
      }]
    });
    
    if (orphanedPicks.length > 0) {
      console.log(`⚠️  Found ${orphanedPicks.length} orphaned picks for inactive events`);
      orphanedPicks.forEach(pick => {
        console.log(`  - Pick ID: ${pick.id}, User: ${pick.userId}, Event: ${pick.eventId}`);
      });
    } else {
      console.log('✅ No orphaned picks found');
    }
    
    // Test 3: Check inactive events
    console.log('\n🚫 Checking inactive events...');
    const inactiveEvents = await Event.findAll({
      where: { isActive: false }
    });
    
    if (inactiveEvents.length > 0) {
      console.log(`⚠️  Found ${inactiveEvents.length} inactive events`);
      inactiveEvents.forEach(event => {
        console.log(`  - ${event.name} (ID: ${event.id}, Deleted: ${event.updatedAt})`);
      });
    } else {
      console.log('✅ No inactive events found');
    }
    
    console.log('\n✅ Cleanup test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testCleanup();
