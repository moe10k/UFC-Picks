const { sequelize } = require('../config/database');

/**
 * Migration to add missing foreign key constraints
 * 
 * This migration adds the missing foreign key constraint for the picks table
 * to ensure proper CASCADE DELETE behavior when events are deleted.
 */

const migration = {
  async up() {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🔗 Adding missing foreign key constraints...');
      
      // Check if the constraint already exists
      const constraints = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'picks' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME LIKE '%event%'
      `, { type: sequelize.QueryTypes.SELECT, transaction });
      
      if (constraints.length === 0) {
        console.log('📋 Adding foreign key constraint for picks.event_id -> events.id...');
        
        // Add foreign key constraint for picks table to events table
        await sequelize.query(`
          ALTER TABLE picks 
          ADD CONSTRAINT fk_picks_event 
          FOREIGN KEY (event_id) REFERENCES events(id) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `, { transaction });
        
        console.log('✅ Foreign key constraint added successfully');
      } else {
        console.log('ℹ️  Foreign key constraint already exists, skipping...');
      }
      
      // Commit transaction
      await transaction.commit();
      
      console.log('🎉 Foreign key constraints migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      await transaction.rollback();
      throw error;
    }
  },
  
  async down() {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back foreign key constraints...');
      
      // Remove the foreign key constraint
      await sequelize.query(`
        ALTER TABLE picks 
        DROP FOREIGN KEY fk_picks_event
      `, { transaction });
      
      console.log('✅ Foreign key constraint removed');
      
      // Commit rollback
      await transaction.commit();
      
      console.log('✅ Foreign key constraints rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      await transaction.rollback();
      throw error;
    }
  }
};

module.exports = migration;
