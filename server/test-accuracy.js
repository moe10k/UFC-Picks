const { sequelize } = require('./config/database');
const UserStats = require('./models/UserStats');
const Pick = require('./models/Pick');

async function testAccuracy() {
  try {
    console.log('🔍 Testing accuracy calculation...');
    
    // Find admin user stats
    const adminStats = await UserStats.findOne({
      where: { userId: 1 } // Assuming admin has ID 1
    });
    
    if (adminStats) {
      console.log('📊 Admin User Stats:');
      console.log(`  Total Picks: ${adminStats.totalPicks}`);
      console.log(`  Correct Picks: ${adminStats.correctPicks}`);
      console.log(`  Average Accuracy: ${adminStats.averageAccuracy}`);
      console.log(`  Raw average_accuracy field: ${adminStats.getDataValue('averageAccuracy')}`);
      
      // Calculate what it should be
      if (adminStats.totalPicks > 0) {
        const expectedAccuracy = (adminStats.correctPicks / adminStats.totalPicks) * 100;
        console.log(`  Expected Accuracy: ${expectedAccuracy.toFixed(2)}%`);
      }
    } else {
      console.log('❌ No admin stats found');
    }
    
    // Check picks
    const adminPicks = await Pick.findAll({
      where: { userId: 1 }
    });
    
    console.log(`\n📝 Admin Picks: ${adminPicks.length} total`);
    adminPicks.forEach(pick => {
      console.log(`  Event ${pick.eventId}: ${pick.correctPicks}/${pick.totalPicks} correct, Accuracy: ${pick.accuracy}%`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing accuracy:', error);
    process.exit(1);
  }
}

testAccuracy();
