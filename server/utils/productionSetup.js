const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const productionSetup = async () => {
  try {
    console.log('🚀 Starting production setup...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');
    
    // Check if owner/admin user exists
    const existingOwner = await User.findOne({ where: { role: 'owner' } });
    
    if (!existingOwner) {
      console.log('👑 Creating owner user...');
      
      // Create owner user with secure password
      const ownerPassword = process.env.OWNER_PASSWORD || 'ChangeMe123!';
      const hashedPassword = await bcrypt.hash(ownerPassword, 12);
      
      const owner = await User.create({
        username: 'admin',
        email: 'admin@ufcpicks.com',
        password: hashedPassword,
        role: 'owner',
        isAdmin: true,
        isActive: true
      });
      
      console.log('✅ Owner user created successfully');
      console.log(`   Username: ${owner.username}`);
      console.log(`   Email: ${owner.email}`);
      console.log(`   Password: ${ownerPassword}`);
      console.log('⚠️  IMPORTANT: Change the password after first login!');
    } else {
      console.log('✅ Owner user already exists');
    }
    
    // Check if there are any users at all
    const userCount = await User.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    console.log('🎉 Production setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  productionSetup();
}

module.exports = productionSetup;
