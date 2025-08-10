const { sequelize } = require('../config/database');
const User = require('../models/User');
const { migrateUFC319 } = require('./migrateUFC319');

const productionSetup = async () => {
  try {
    console.log('🚀 Starting production setup...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database to ensure tables exist
    console.log('📋 Syncing database tables...');
    await sequelize.sync({ force: false }); // Don't force, just create if missing
    console.log('✅ Database tables ready');
    
    // Run UFC 319 migration
    console.log('🔄 Running UFC 319 migration...');
    await migrateUFC319();
    console.log('✅ UFC 319 migration completed');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      where: { 
        email: 'admin@ufcpicks.com' 
      } 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username);
      console.log('   Email:', existingAdmin.email);
      console.log('   Is Admin:', existingAdmin.isAdmin);
      console.log('   Is Owner:', existingAdmin.isOwner);
      return;
    }
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@ufcpicks.com',
      password: 'admin123',
      isAdmin: true,
      isOwner: true,
      isActive: true
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('   Username:', adminUser.username);
    console.log('   Email:', adminUser.email);
    console.log('   Is Admin:', adminUser.isAdmin);
    console.log('   Is Owner:', adminUser.isOwner);
    console.log('\n🔑 Login credentials:');
    console.log('   Email: admin@ufcpicks.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script if called directly
if (require.main === module) {
  productionSetup();
}

module.exports = productionSetup;
