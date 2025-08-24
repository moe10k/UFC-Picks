const UserStatsRecalculator = require('./utils/recalculateUserStats');

async function recalculateAdminStats() {
  try {
    console.log('🔄 Recalculating stats for admin user...');
    
    const statsRecalculator = new UserStatsRecalculator();
    
    // Assuming admin user has ID 1, but we should find the admin user
    const { User } = require('./models/associations');
    
    const adminUser = await User.findOne({ where: { isAdmin: true } });
    if (!adminUser) {
      console.error('❌ No admin user found');
      process.exit(1);
    }
    
    console.log(`📊 Found admin user: ${adminUser.username} (ID: ${adminUser.id})`);
    
    const result = await statsRecalculator.recalculateUserStats(adminUser.id);
    
    if (result) {
      console.log('✅ Admin stats recalculated successfully:', result.toJSON());
    } else {
      console.error('❌ Failed to recalculate admin stats');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error recalculating admin stats:', error);
    process.exit(1);
  }
}

recalculateAdminStats();
