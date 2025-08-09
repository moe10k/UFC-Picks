const { sequelize } = require('../config/database');
const User = require('../models/User');
const Pick = require('../models/Pick');
const Event = require('../models/Event');

/**
 * Utility function to recalculate all user statistics from their actual picks
 * This fixes any incorrect totals that may have accumulated over time
 */
async function recalculateAllUserStats() {
  try {
    console.log('🔄 Starting user statistics recalculation...');
    
    // Get all active users
    const users = await User.findAll({ where: { isActive: true } });
    console.log(`📊 Found ${users.length} active users to recalculate`);
    
    let totalRecalculated = 0;
    
    for (const user of users) {
      console.log(`\n👤 Recalculating stats for ${user.username}...`);
      
      // Get all scored picks for this user across all events
      const allUserPicks = await Pick.findAll({
        where: { 
          user_id: user.id, 
          isScored: true 
        },
        include: [{
          model: Event,
          as: 'event',
          where: { isActive: true } // Only count picks for active events
        }]
      });
      
      // Calculate totals from scratch
      let recalculatedTotalPoints = 0;
      let recalculatedCorrectPicks = 0;
      let recalculatedTotalPicks = 0;
      let recalculatedEventsParticipated = 0;
      let recalculatedBestEventScore = 0;
      
      for (const userPick of allUserPicks) {
        recalculatedTotalPoints += userPick.totalPoints || 0;
        recalculatedCorrectPicks += userPick.correctPicks || 0;
        recalculatedTotalPicks += userPick.picks?.length || 0;
        recalculatedEventsParticipated += 1;
        recalculatedBestEventScore = Math.max(recalculatedBestEventScore, userPick.totalPoints || 0);
      }
      
      // Check if totals are different from current values
      const hasChanges = 
        user.totalPoints !== recalculatedTotalPoints ||
        user.correctPicks !== recalculatedCorrectPicks ||
        user.totalPicks !== recalculatedTotalPicks ||
        user.eventsParticipated !== recalculatedEventsParticipated ||
        user.bestEventScore !== recalculatedBestEventScore;
      
      if (hasChanges) {
        console.log(`  📝 Updating ${user.username}:`);
        console.log(`    Total Points: ${user.totalPoints} → ${recalculatedTotalPoints}`);
        console.log(`    Correct Picks: ${user.correctPicks} → ${recalculatedCorrectPicks}`);
        console.log(`    Total Picks: ${user.totalPicks} → ${recalculatedTotalPicks}`);
        console.log(`    Events Participated: ${user.eventsParticipated} → ${recalculatedEventsParticipated}`);
        console.log(`    Best Event Score: ${user.bestEventScore} → ${recalculatedBestEventScore}`);
        
        await user.update({
          totalPoints: recalculatedTotalPoints,
          totalPicks: recalculatedTotalPicks,
          correctPicks: recalculatedCorrectPicks,
          eventsParticipated: recalculatedEventsParticipated,
          bestEventScore: recalculatedBestEventScore
        });
        
        totalRecalculated++;
      } else {
        console.log(`  ✅ ${user.username}: No changes needed`);
      }
    }
    
    console.log(`\n🎉 Recalculation completed! ${totalRecalculated} users updated.`);
    return { success: true, usersUpdated: totalRecalculated };
    
  } catch (error) {
    console.error('❌ Error during user statistics recalculation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Recalculate statistics for a specific user
 */
async function recalculateUserStats(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log(`🔄 Recalculating stats for ${user.username}...`);
    
    // Get all scored picks for this user across all events
    const allUserPicks = await Pick.findAll({
      where: { 
        user_id: user.id, 
        isScored: true 
      },
      include: [{
        model: Event,
        as: 'event',
        where: { isActive: true }
      }]
    });
    
    // Calculate totals from scratch
    let recalculatedTotalPoints = 0;
    let recalculatedCorrectPicks = 0;
    let recalculatedTotalPicks = 0;
    let recalculatedEventsParticipated = 0;
    let recalculatedBestEventScore = 0;
    
    for (const userPick of allUserPicks) {
      recalculatedTotalPoints += userPick.totalPoints || 0;
      recalculatedCorrectPicks += userPick.correctPicks || 0;
      recalculatedTotalPicks += userPick.picks?.length || 0;
      recalculatedEventsParticipated += 1;
      recalculatedBestEventScore = Math.max(recalculatedBestEventScore, userPick.totalPoints || 0);
    }
    
    await user.update({
      totalPoints: recalculatedTotalPoints,
      totalPicks: recalculatedTotalPicks,
      correctPicks: recalculatedCorrectPicks,
      eventsParticipated: recalculatedEventsParticipated,
      bestEventScore: recalculatedBestEventScore
    });
    
    console.log(`✅ ${user.username} stats updated successfully`);
    return { success: true, user: user.username, stats: { recalculatedTotalPoints, recalculatedCorrectPicks, recalculatedTotalPicks, recalculatedEventsParticipated, recalculatedBestEventScore } };
    
  } catch (error) {
    console.error('❌ Error during user statistics recalculation:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  recalculateAllUserStats,
  recalculateUserStats
};
