const { sequelize } = require('../config/database');

const migrateRemoveNameFields = async () => {
  try {
    console.log('🔄 Starting migration to remove firstName and lastName fields...');

    // First, let's check what columns actually exist
    const [results] = await sequelize.query("PRAGMA table_info(users);");
    console.log('Current table structure:');
    results.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    // Check if firstName/first_name column exists
    const firstNameColumn = results.find(col => 
      col.name === 'firstName' || col.name === 'first_name'
    );
    
    // Check if lastName/last_name column exists
    const lastNameColumn = results.find(col => 
      col.name === 'lastName' || col.name === 'last_name'
    );

    if (firstNameColumn) {
      console.log(`Found firstName column: ${firstNameColumn.name}`);
      await sequelize.query(`ALTER TABLE users DROP COLUMN ${firstNameColumn.name};`);
      console.log('✅ Removed firstName column');
    } else {
      console.log('ℹ️  firstName column not found');
    }

    if (lastNameColumn) {
      console.log(`Found lastName column: ${lastNameColumn.name}`);
      await sequelize.query(`ALTER TABLE users DROP COLUMN ${lastNameColumn.name};`);
      console.log('✅ Removed lastName column');
    } else {
      console.log('ℹ️  lastName column not found');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('The firstName and lastName fields have been removed from the users table.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await sequelize.close();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateRemoveNameFields();
}

module.exports = migrateRemoveNameFields;
