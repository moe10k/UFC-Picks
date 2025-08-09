const { sequelize } = require('../config/database');
const User = require('../models/User');

const setupOwner = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Find the first admin user (or create one if none exists)
    let ownerUser = await User.findOne({ 
      where: { isAdmin: true },
      order: [['createdAt', 'ASC']] // Get the oldest admin
    });

    if (!ownerUser) {
      console.log('No admin users found. Please create an admin user first.');
      return;
    }

    // Set this user as the owner
    await ownerUser.update({ 
      isOwner: true,
      isAdmin: true // Ensure they remain admin as well
    });

    console.log(`✅ Successfully set user "${ownerUser.username}" (ID: ${ownerUser.id}) as the owner.`);
    console.log('Owner accounts have full admin privileges and cannot be demoted or deactivated.');

  } catch (error) {
    console.error('Error setting up owner:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the script if called directly
if (require.main === module) {
  setupOwner();
}

module.exports = setupOwner;
