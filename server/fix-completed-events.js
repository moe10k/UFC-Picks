const { sequelize } = require('./config/database');
const setupAssociations = require('./models/associations');
const Event = require('./models/Event');
const Fight = require('./models/Fight');
const { Op } = require('sequelize');

async function fixCompletedEvents() {
  try {
    // Setup database connection and associations
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    setupAssociations();
    console.log('✅ Associations set up');
    
    console.log('🔍 Finding events with completed fights...');
    
    // Find all events that have fights with isCompleted = true
    const eventsWithCompletedFights = await Event.findAll({
      include: [{
        model: Fight,
        as: 'fights',
        where: { isCompleted: true }
      }],
      where: { isActive: true }
    });
    
    console.log(`📊 Found ${eventsWithCompletedFights.length} events with completed fights`);
    
    // Update each event's status to 'completed'
    for (const event of eventsWithCompletedFights) {
      if (event.status !== 'completed') {
        console.log(`🔄 Updating event "${event.name}" (ID: ${event.id}) from status "${event.status}" to "completed"`);
        await event.update({ status: 'completed' });
      } else {
        console.log(`✅ Event "${event.name}" (ID: ${event.id}) already has status "completed"`);
      }
    }
    
    // Also check for events that might have the old status logic
    console.log('\n🔍 Checking for events that might need status updates...');
    
    const allEvents = await Event.findAll({
      include: [{ model: Fight, as: 'fights' }],
      where: { isActive: true }
    });
    
    for (const event of allEvents) {
      const hasCompletedFights = event.fights && event.fights.some(fight => fight.isCompleted);
      const shouldBeCompleted = hasCompletedFights || event.status === 'completed';
      
      if (shouldBeCompleted && event.status !== 'completed') {
        console.log(`🔄 Updating event "${event.name}" (ID: ${event.id}) from status "${event.status}" to "completed"`);
        await event.update({ status: 'completed' });
      }
    }
    
    console.log('\n✅ Completed events status fix completed!');
    
    // Show final status of all events
    const finalEvents = await Event.findAll({
      include: [{ model: Fight, as: 'fights' }],
      where: { isActive: true },
      order: [['date', 'DESC']]
    });
    
    console.log('\n📋 Final event statuses:');
    for (const event of finalEvents) {
      const completedFights = event.fights ? event.fights.filter(f => f.isCompleted).length : 0;
      const totalFights = event.fights ? event.fights.length : 0;
      console.log(`  ${event.name}: ${event.status} (${completedFights}/${totalFights} fights completed)`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing completed events:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixCompletedEvents();
