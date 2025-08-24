const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const UserStats = require('../models/UserStats');
const Pick = require('../models/Pick');
const PickDetail = require('../models/PickDetail');
const Fight = require('../models/Fight');

// Ensure associations are set up
const setupAssociations = require('../models/associations');
setupAssociations();

/**
 * User Stats Recalculation Utility
 * 
 * This utility recalculates all user statistics based on the new normalized schema.
 * It aggregates data from picks, pick_details, and events tables to provide
 * accurate, up-to-date statistics for all users.
 */

class UserStatsRecalculator {
  constructor() {
    this.batchSize = 100; // Process users in batches
  }

  /**
   * Recalculate stats for a specific user
   */
  async recalculateUserStats(userId) {
    try {
      console.log(`🔄 Recalculating stats for user ${userId}...`);
      
      // Get all picks for the user
      const picks = await Pick.findAll({
        where: { userId },
        include: [
          {
            model: PickDetail,
            as: 'pickDetails',
            include: [
              {
                model: Fight,
                as: 'fight'
              }
            ]
          }
        ]
      });

      let totalPicks = 0;
      let correctPicks = 0;
      let totalPoints = 0;
      let eventsParticipated = 0;
      let bestEventScore = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let eventScores = [];

      // Calculate stats from picks
      for (const pick of picks) {
        if (pick.isSubmitted) {
          eventsParticipated++;
          
          let eventCorrectPicks = 0;
          let eventTotalPicks = pick.pickDetails.length;
          let eventPoints = 0;
          
          for (const pickDetail of pick.pickDetails) {
            totalPicks++;
            
            if (pickDetail.isCorrect) {
              correctPicks++;
              eventCorrectPicks++;
              eventPoints += pickDetail.pointsEarned;
            }
          }
          
          totalPoints += eventPoints;
          
          // Track event scores for streak calculation
          if (eventTotalPicks > 0) {
            const eventAccuracy = (eventCorrectPicks / eventTotalPicks) * 100;
            eventScores.push({
              eventId: pick.eventId,
              score: eventPoints,
              accuracy: eventAccuracy,
              correctPicks: eventCorrectPicks,
              totalPicks: eventTotalPicks
            });
            
            if (eventPoints > bestEventScore) {
              bestEventScore = eventPoints;
            }
          }
        }
      }

      // Calculate streaks
      const { currentStreak: calculatedCurrentStreak, longestStreak: calculatedLongestStreak } = 
        this.calculateStreaks(eventScores);

      currentStreak = calculatedCurrentStreak;
      longestStreak = calculatedLongestStreak;

      // Calculate average accuracy
      const averageAccuracy = totalPicks > 0 ? parseFloat(((correctPicks / totalPicks) * 100).toFixed(2)) : 0.00;

      // Create or update user stats
      const [userStats, created] = await UserStats.findOrCreate({
        where: { userId },
        defaults: {
          totalPicks,
          correctPicks,
          totalPoints,
          eventsParticipated,
          bestEventScore,
          currentStreak,
          longestStreak,
          averageAccuracy
        }
      });

      if (!created) {
        await userStats.update({
          totalPicks,
          correctPicks,
          totalPoints,
          eventsParticipated,
          bestEventScore,
          currentStreak,
          longestStreak,
          averageAccuracy
        });
      }

      console.log(`✅ User ${userId} stats updated:`, {
        totalPicks,
        correctPicks,
        totalPoints,
        eventsParticipated,
        bestEventScore,
        currentStreak,
        longestStreak
      });

      return userStats;

    } catch (error) {
      console.error(`❌ Error recalculating stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate current and longest streaks based on event performance
   */
  calculateStreaks(eventScores) {
    if (eventScores.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort events by date (assuming events are processed in chronological order)
    // For now, we'll use the order they appear in the array
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (const eventScore of eventScores) {
      // Consider it a "win" if accuracy is above 50% or score is above average
      const isWin = eventScore.accuracy >= 50 || eventScore.score > 0;
      
      if (isWin) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    currentStreak = tempStreak;

    return { currentStreak, longestStreak };
  }

  /**
   * Recalculate stats for all users
   */
  async recalculateAllUserStats() {
    try {
      console.log('🔄 Starting bulk user stats recalculation...');
      
      // Get all user IDs
      const users = await sequelize.query(`
        SELECT id FROM users WHERE is_active = 1
      `, { type: QueryTypes.SELECT });

      console.log(`📊 Found ${users.length} active users to process`);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process users in batches
      for (let i = 0; i < users.length; i += this.batchSize) {
        const batch = users.slice(i, i + this.batchSize);
        
        console.log(`🔄 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(users.length / this.batchSize)}`);
        
        for (const user of batch) {
          try {
            await this.recalculateUserStats(user.id);
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push({ userId: user.id, error: error.message });
            console.error(`❌ Failed to process user ${user.id}:`, error.message);
          }
        }
      }

      console.log('🎉 Bulk recalculation completed!');
      console.log(`📊 Summary:`);
      console.log(`   - Total users: ${users.length}`);
      console.log(`   - Successful: ${successCount}`);
      console.log(`   - Failed: ${errorCount}`);

      if (errors.length > 0) {
        console.log('⚠️  Errors encountered:');
        errors.forEach(({ userId, error }) => {
          console.log(`   - User ${userId}: ${error}`);
        });
      }

      return { successCount, errorCount, errors };

    } catch (error) {
      console.error('❌ Bulk recalculation failed:', error);
      throw error;
    }
  }

  /**
   * Recalculate stats for users who participated in a specific event
   */
  async recalculateEventUserStats(eventId) {
    try {
      console.log(`🔄 Recalculating stats for users who participated in event ${eventId}...`);
      
      // Get all users who made picks for this event
      const users = await sequelize.query(`
        SELECT DISTINCT user_id FROM picks WHERE event_id = ?
      `, {
        replacements: [eventId],
        type: QueryTypes.SELECT
      });

      console.log(`📊 Found ${users.length} users who participated in event ${eventId}`);

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          await this.recalculateUserStats(user.user_id);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to recalculate stats for user ${user.user_id}:`, error.message);
        }
      }

      console.log(`✅ Event ${eventId} user stats recalculation completed`);
      console.log(`📊 Summary: ${successCount} successful, ${errorCount} failed`);

      return { successCount, errorCount };

    } catch (error) {
      console.error(`❌ Error recalculating event ${eventId} user stats:`, error);
      throw error;
    }
  }

  /**
   * Get user stats summary
   */
  async getUserStatsSummary() {
    try {
      const summary = await sequelize.query(`
        SELECT 
          COUNT(*) as totalUsers,
          AVG(total_points) as avgTotalPoints,
          AVG(average_accuracy) as avgAccuracy,
          MAX(total_points) as maxTotalPoints,
          MAX(average_accuracy) as maxAccuracy,
          SUM(events_participated) as totalEventsParticipated
        FROM user_stats
      `, { type: QueryTypes.SELECT });

      return summary[0];
    } catch (error) {
      console.error('❌ Error getting user stats summary:', error);
      throw error;
    }
  }

  /**
   * Validate user stats integrity
   */
  async validateUserStats() {
    try {
      console.log('🔍 Validating user stats integrity...');
      
      const validationResults = await sequelize.query(`
        SELECT 
          us.user_id,
          us.total_picks as stats_total_picks,
          us.correct_picks as stats_correct_picks,
          us.total_points as stats_total_points,
          us.events_participated as stats_events_participated,
          COUNT(pd.id) as actual_total_picks,
          SUM(CASE WHEN pd.is_correct = 1 THEN 1 ELSE 0 END) as actual_correct_picks,
          SUM(pd.points_earned) as actual_total_points,
          COUNT(DISTINCT p.event_id) as actual_events_participated
        FROM user_stats us
        LEFT JOIN picks p ON us.user_id = p.user_id AND p.is_submitted = 1
        LEFT JOIN pick_details pd ON p.id = pd.pick_id
        GROUP BY us.user_id
        HAVING 
          us.total_picks != actual_total_picks OR
          us.correct_picks != actual_correct_picks OR
          us.total_points != actual_total_points OR
          us.events_participated != actual_events_participated
      `, { type: QueryTypes.SELECT });

      if (validationResults.length === 0) {
        console.log('✅ All user stats are consistent with actual data');
        return { isValid: true, inconsistencies: [] };
      } else {
        console.log(`⚠️  Found ${validationResults.length} users with inconsistent stats`);
        return { isValid: false, inconsistencies: validationResults };
      }

    } catch (error) {
      console.error('❌ Error validating user stats:', error);
      throw error;
    }
  }
}

module.exports = UserStatsRecalculator;
