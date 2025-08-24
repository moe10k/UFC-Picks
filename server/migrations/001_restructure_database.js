const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Comprehensive Database Restructuring Migration
 * 
 * This migration converts the existing JSON-based schema to a normalized schema:
 * - Creates new tables: fights, pick_details, user_stats
 * - Migrates JSON data from events.fights to fights table
 * - Migrates JSON data from picks.picks to pick_details table
 * - Removes denormalized stats from users table
 * - Adds proper foreign key constraints and indexes
 * - Includes rollback procedures
 */

const migration = {
  // Helper function to format fighter records
  formatFighterRecord(record) {
    if (!record) return null;
    
    // If it's already a string, return as is
    if (typeof record === 'string') return record;
    
    // If it's an object with wins/losses/draws, convert to string format
    if (typeof record === 'object' && record.wins !== undefined) {
      return `${record.wins}-${record.losses || 0}-${record.draws || 0}`;
    }
    
    // If it's any other object, try to stringify it
    if (typeof record === 'object') {
      return JSON.stringify(record);
    }
    
    // Fallback to string conversion
    return String(record);
  },

  async up() {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🚀 Starting database restructuring migration...');
      
      // Step 1: Create new tables
      console.log('📋 Creating new tables...');
      
      // Create fights table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS fights (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          fight_number INT NOT NULL,
          weight_class VARCHAR(100) NOT NULL,
          is_main_card BOOLEAN DEFAULT FALSE,
          is_main_event BOOLEAN DEFAULT FALSE,
          is_co_main_event BOOLEAN DEFAULT FALSE,
          fighter1_name VARCHAR(200) NOT NULL,
          fighter2_name VARCHAR(200) NOT NULL,
          fighter1_nick VARCHAR(200),
          fighter2_nick VARCHAR(200),
          fighter1_image VARCHAR(500),
          fighter2_image VARCHAR(500),
          fighter1_record VARCHAR(100),
          fighter2_record VARCHAR(100),
          is_completed BOOLEAN DEFAULT FALSE,
          winner ENUM('fighter1', 'fighter2', 'draw', 'no_contest'),
          method ENUM('KO/TKO', 'Submission', 'Decision', 'Draw', 'No Contest'),
          round INT CHECK (round >= 1 AND round <= 5),
          time VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_event_fight (event_id, fight_number),
          INDEX idx_event_id (event_id),
          INDEX idx_weight_class (weight_class),
          INDEX idx_is_main_card (is_main_card),
          INDEX idx_is_completed (is_completed),
          INDEX idx_fighter1_name (fighter1_name),
          INDEX idx_fighter2_name (fighter2_name),
          UNIQUE KEY unique_event_fight (event_id, fight_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `, { transaction });
      
      // Create pick_details table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS pick_details (
          id INT AUTO_INCREMENT PRIMARY KEY,
          pick_id INT NOT NULL,
          fight_id INT NOT NULL,
          predicted_winner ENUM('fighter1', 'fighter2') NOT NULL,
          predicted_method ENUM('KO/TKO', 'Submission', 'Decision') NOT NULL,
          predicted_round INT CHECK (predicted_round >= 1 AND predicted_round <= 5),
          predicted_time VARCHAR(50),
          points_earned INT DEFAULT 0,
          is_correct BOOLEAN DEFAULT FALSE,
          scored_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pick_fight (pick_id, fight_id),
          INDEX idx_pick_id (pick_id),
          INDEX idx_fight_id (fight_id),
          INDEX idx_is_correct (is_correct),
          INDEX idx_points_earned (points_earned),
          UNIQUE KEY unique_pick_fight (pick_id, fight_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `, { transaction });
      
      // Create user_stats table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS user_stats (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          total_picks INT DEFAULT 0,
          correct_picks INT DEFAULT 0,
          total_points INT DEFAULT 0,
          events_participated INT DEFAULT 0,
          best_event_score INT DEFAULT 0,
          current_streak INT DEFAULT 0,
          longest_streak INT DEFAULT 0,
          average_accuracy DECIMAL(5,2) DEFAULT 0.00,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_total_points (total_points),
          INDEX idx_average_accuracy (average_accuracy),
          INDEX idx_events_participated (events_participated),
          INDEX idx_current_streak (current_streak),
          UNIQUE KEY unique_user_stats (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `, { transaction });
      
      console.log('✅ New tables created successfully');
      
      // Step 2: Migrate fights data from events.fights JSON
      console.log('🔄 Migrating fights data...');
      
      const events = await sequelize.query(`
        SELECT id, fights FROM events WHERE fights IS NOT NULL AND fights != '[]'
      `, { type: QueryTypes.SELECT, transaction });
      
      let totalFightsMigrated = 0;
      
      for (const event of events) {
        try {
          const fights = JSON.parse(event.fights);
          
          for (const fight of fights) {
            await sequelize.query(`
              INSERT INTO fights (
                event_id, fight_number, weight_class, is_main_card, is_main_event, is_co_main_event,
                fighter1_name, fighter2_name, fighter1_nick, fighter2_nick,
                fighter1_image, fighter2_image, fighter1_record, fighter2_record,
                is_completed, winner, method, round, time
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, {
              replacements: [
                event.id,
                fight.fightNumber || 0,
                fight.weightClass || 'Unknown',
                fight.isMainCard || false,
                fight.isMainEvent || false,
                fight.isCoMainEvent || false,
                fight.fighter1?.name || 'Unknown Fighter 1',
                fight.fighter2?.name || 'Unknown Fighter 2',
                fight.fighter1?.nickname || null,
                fight.fighter2?.nickname || null,
                fight.fighter1?.image || null,
                fight.fighter2?.image || null,
                migration.formatFighterRecord(fight.fighter1?.record) || null,
                migration.formatFighterRecord(fight.fighter2?.record) || null,
                fight.isCompleted || false,
                fight.result?.winner || null,
                fight.result?.method || null,
                fight.result?.round || null,
                fight.result?.time || null
              ],
              transaction
            });
            
            totalFightsMigrated++;
          }
        } catch (error) {
          console.error(`❌ Error migrating fights for event ${event.id}:`, error);
          throw error;
        }
      }
      
      console.log(`✅ Migrated ${totalFightsMigrated} fights successfully`);
      
      // Step 3: Migrate picks data from picks.picks JSON
      console.log('🔄 Migrating picks data...');
      
      const picks = await sequelize.query(`
        SELECT id, user_id, event_id, picks FROM picks WHERE picks IS NOT NULL AND picks != '[]'
      `, { type: QueryTypes.SELECT, transaction });
      
      let totalPickDetailsMigrated = 0;
      
      for (const pick of picks) {
        try {
          const pickData = JSON.parse(pick.picks);
          
          for (const pickDetail of pickData) {
            // Find the corresponding fight
            const fight = await sequelize.query(`
              SELECT id FROM fights WHERE event_id = ? AND fight_number = ?
            `, {
              replacements: [pick.event_id, pickDetail.fightNumber],
              type: QueryTypes.SELECT,
              transaction
            });
            
            if (fight.length > 0) {
              await sequelize.query(`
                INSERT INTO pick_details (
                  pick_id, fight_id, predicted_winner, predicted_method, predicted_round, predicted_time
                ) VALUES (?, ?, ?, ?, ?, ?)
              `, {
                replacements: [
                  pick.id,
                  fight[0].id,
                  pickDetail.winner || 'fighter1',
                  pickDetail.method || 'Decision',
                  pickDetail.round || null,
                  pickDetail.time || null
                ],
                transaction
              });
              
              totalPickDetailsMigrated++;
            }
          }
        } catch (error) {
          console.error(`❌ Error migrating picks for pick ${pick.id}:`, error);
          throw error;
        }
      }
      
      console.log(`✅ Migrated ${totalPickDetailsMigrated} pick details successfully`);
      
      // Step 4: Migrate user stats
      console.log('🔄 Migrating user stats...');
      
      const users = await sequelize.query(`
        SELECT id, total_picks, correct_picks, total_points, events_participated, best_event_score, current_streak, longest_streak
        FROM users
      `, { type: QueryTypes.SELECT, transaction });
      
      for (const user of users) {
        await sequelize.query(`
          INSERT INTO user_stats (
            user_id, total_picks, correct_picks, total_points, events_participated, 
            best_event_score, current_streak, longest_streak
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            user.id,
            user.total_picks || 0,
            user.correct_picks || 0,
            user.total_points || 0,
            user.events_participated || 0,
            user.best_event_score || 0,
            user.current_streak || 0,
            user.longest_streak || 0
          ],
          transaction
        });
      }
      
      console.log(`✅ Migrated stats for ${users.length} users successfully`);
      
      // Step 5: Update picks table structure
      console.log('🔄 Updating picks table structure...');
      
      // Add new columns to picks table
      await sequelize.query(`
        ALTER TABLE picks 
        ADD COLUMN submitted_at TIMESTAMP NULL AFTER is_submitted,
        ADD COLUMN total_picks INT DEFAULT 0 AFTER correct_picks,
        ADD COLUMN accuracy DECIMAL(5,2) DEFAULT 0.00 AFTER total_picks,
        ADD COLUMN notes TEXT AFTER accuracy
      `, { transaction });
      
      // Update total_picks count from pick_details
      await sequelize.query(`
        UPDATE picks p 
        SET p.total_picks = (
          SELECT COUNT(*) FROM pick_details pd WHERE pd.pick_id = p.id
        )
      `, { transaction });
      
      // Update accuracy
      await sequelize.query(`
        UPDATE picks p 
        SET p.accuracy = CASE 
          WHEN p.total_picks > 0 THEN (p.correct_picks / p.total_picks) * 100
          ELSE 0 
        END
      `, { transaction });
      
      console.log('✅ Picks table structure updated successfully');
      
      // Step 6: Add foreign key constraints
      console.log('🔗 Adding foreign key constraints...');
      
      // Add foreign keys to fights table
      await sequelize.query(`
        ALTER TABLE fights 
        ADD CONSTRAINT fk_fights_event 
        FOREIGN KEY (event_id) REFERENCES events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `, { transaction });
      
      // Add foreign keys to pick_details table
      await sequelize.query(`
        ALTER TABLE pick_details 
        ADD CONSTRAINT fk_pick_details_pick 
        FOREIGN KEY (pick_id) REFERENCES picks(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT fk_pick_details_fight 
        FOREIGN KEY (fight_id) REFERENCES fights(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `, { transaction });
      
      // Add foreign keys to user_stats table
      await sequelize.query(`
        ALTER TABLE user_stats 
        ADD CONSTRAINT fk_user_stats_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `, { transaction });
      
      console.log('✅ Foreign key constraints added successfully');
      
      // Step 7: Remove old columns (after ensuring data is migrated)
      console.log('🧹 Cleaning up old structure...');
      
      // Remove fights column from events table
      await sequelize.query(`
        ALTER TABLE events DROP COLUMN fights
      `, { transaction });
      
      // Remove picks column from picks table
      await sequelize.query(`
        ALTER TABLE picks DROP COLUMN picks
      `, { transaction });
      
      // Remove stats columns from users table
      await sequelize.query(`
        ALTER TABLE users 
        DROP COLUMN total_picks,
        DROP COLUMN correct_picks,
        DROP COLUMN total_points,
        DROP COLUMN events_participated,
        DROP COLUMN best_event_score,
        DROP COLUMN current_streak,
        DROP COLUMN longest_streak
      `, { transaction });
      
      console.log('✅ Old structure cleaned up successfully');
      
      // Commit transaction
      await transaction.commit();
      
      console.log('🎉 Database restructuring migration completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Created 3 new tables: fights, pick_details, user_stats`);
      console.log(`   - Migrated ${totalFightsMigrated} fights`);
      console.log(`   - Migrated ${totalPickDetailsMigrated} pick details`);
      console.log(`   - Migrated stats for ${users.length} users`);
      console.log(`   - Added proper foreign key constraints and indexes`);
      console.log(`   - Removed JSON fields and denormalized stats`);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      await transaction.rollback();
      throw error;
    }
  },
  
  async down() {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back database restructuring...');
      
      // Step 1: Restore old columns
      console.log('📋 Restoring old table structure...');
      
      // Add fights column back to events table
      await sequelize.query(`
        ALTER TABLE events 
        ADD COLUMN fights TEXT DEFAULT '[]' AFTER pick_deadline
      `, { transaction });
      
      // Add picks column back to picks table
      await sequelize.query(`
        ALTER TABLE picks 
        ADD COLUMN picks TEXT DEFAULT '[]' AFTER event_id
      `, { transaction });
      
      // Add stats columns back to users table
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN total_picks INT DEFAULT 0 AFTER is_active,
        ADD COLUMN correct_picks INT DEFAULT 0 AFTER total_picks,
        ADD COLUMN total_points INT DEFAULT 0 AFTER correct_picks,
        ADD COLUMN events_participated INT DEFAULT 0 AFTER total_points,
        ADD COLUMN best_event_score INT DEFAULT 0 AFTER events_participated,
        ADD COLUMN current_streak INT DEFAULT 0 AFTER best_event_score,
        ADD COLUMN longest_streak INT DEFAULT 0 AFTER current_streak
      `, { transaction });
      
      console.log('✅ Old table structure restored');
      
      // Step 2: Migrate data back to JSON format
      console.log('🔄 Migrating data back to JSON format...');
      
      // Migrate fights back to events.fights
      const events = await sequelize.query(`
        SELECT e.id, e.name, f.* FROM events e
        LEFT JOIN fights f ON e.id = f.event_id
        ORDER BY e.id, f.fight_number
      `, { type: QueryTypes.SELECT, transaction });
      
      const eventFightsMap = new Map();
      
      for (const row of events) {
        if (!eventFightsMap.has(row.id)) {
          eventFightsMap.set(row.id, []);
        }
        
        if (row.fight_id) {
          eventFightsMap.get(row.id).push({
            fightNumber: row.fight_number,
            weightClass: row.weight_class,
            isMainCard: row.is_main_card,
            isMainEvent: row.is_main_event,
            isCoMainEvent: row.is_co_main_event,
            fighter1: {
              name: row.fighter1_name,
              nickname: row.fighter1_nick,
              image: row.fighter1_image,
              record: row.fighter1_record
            },
            fighter2: {
              name: row.fighter2_name,
              nickname: row.fighter2_nick,
              image: row.fighter2_image,
              record: row.fighter2_record
            },
            isCompleted: row.is_completed,
            result: row.is_completed ? {
              winner: row.winner,
              method: row.method,
              round: row.round,
              time: row.time
            } : null
          });
        }
      }
      
      for (const [eventId, fights] of eventFightsMap) {
        await sequelize.query(`
          UPDATE events SET fights = ? WHERE id = ?
        `, {
          replacements: [JSON.stringify(fights), eventId],
          transaction
        });
      }
      
      console.log(`✅ Migrated fights back to ${eventFightsMap.size} events`);
      
      // Migrate pick details back to picks.picks
      const picks = await sequelize.query(`
        SELECT p.id, p.user_id, p.event_id, pd.*, f.fight_number 
        FROM picks p
        LEFT JOIN pick_details pd ON p.id = pd.pick_id
        LEFT JOIN fights f ON pd.fight_id = f.id
        ORDER BY p.id, f.fight_number
      `, { type: QueryTypes.SELECT, transaction });
      
      const pickDetailsMap = new Map();
      
      for (const row of picks) {
        if (!pickDetailsMap.has(row.id)) {
          pickDetailsMap.set(row.id, []);
        }
        
        if (row.pick_detail_id) {
          pickDetailsMap.get(row.id).push({
            fightNumber: row.fight_number,
            winner: row.predicted_winner,
            method: row.predicted_method,
            round: row.predicted_round,
            time: row.predicted_time
          });
        }
      }
      
      for (const [pickId, pickDetails] of pickDetailsMap) {
        await sequelize.query(`
          UPDATE picks SET picks = ? WHERE id = ?
        `, {
          replacements: [JSON.stringify(pickDetails), pickId],
          transaction
        });
      }
      
      console.log(`✅ Migrated pick details back to ${pickDetailsMap.size} picks`);
      
      // Migrate user stats back to users table
      const userStats = await sequelize.query(`
        SELECT user_id, total_picks, correct_picks, total_points, events_participated, 
               best_event_score, current_streak, longest_streak
        FROM user_stats
      `, { type: QueryTypes.SELECT, transaction });
      
      for (const stats of userStats) {
        await sequelize.query(`
          UPDATE users SET 
            total_picks = ?, correct_picks = ?, total_points = ?, events_participated = ?,
            best_event_score = ?, current_streak = ?, longest_streak = ?
          WHERE id = ?
        `, {
          replacements: [
            stats.total_picks, stats.correct_picks, stats.total_points, stats.events_participated,
            stats.best_event_score, stats.current_streak, stats.longest_streak, stats.user_id
          ],
          transaction
        });
      }
      
      console.log(`✅ Migrated stats back to ${userStats.length} users`);
      
      // Step 3: Drop new tables
      console.log('🗑️ Dropping new tables...');
      
      await sequelize.query('DROP TABLE IF EXISTS pick_details', { transaction });
      await sequelize.query('DROP TABLE IF EXISTS fights', { transaction });
      await sequelize.query('DROP TABLE IF EXISTS user_stats', { transaction });
      
      console.log('✅ New tables dropped');
      
      // Step 4: Remove new columns from picks table
      await sequelize.query(`
        ALTER TABLE picks 
        DROP COLUMN submitted_at,
        DROP COLUMN total_picks,
        DROP COLUMN accuracy,
        DROP COLUMN notes
      `, { transaction });
      
      console.log('✅ New columns removed from picks table');
      
      // Commit rollback
      await transaction.commit();
      
      console.log('✅ Database restructuring rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      await transaction.rollback();
      throw error;
    }
  }
};

module.exports = migration;
