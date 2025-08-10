const { Sequelize } = require('sequelize');

// Create a direct connection to the production database
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

const createAdminUser = async () => {
  try {
    console.log('🚀 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if users table exists and has data
    const [results] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    console.log(`📊 Current users in database: ${results[0].count}`);
    
    // Check if admin user already exists
    const [adminCheck] = await sequelize.query("SELECT id, username, email, is_admin, is_owner FROM users WHERE email = 'admin@ufcpicks.com'");
    
    if (adminCheck.length > 0) {
      console.log('✅ Admin user already exists:', adminCheck[0]);
      return;
    }
    
    // Create admin user with hashed password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const [newUser] = await sequelize.query(`
      INSERT INTO users (username, email, password, is_admin, is_owner, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, username, email, is_admin, is_owner
    `, ['admin', 'admin@ufcpicks.com', hashedPassword, true, true, true]);
    
    console.log('✅ Admin user created successfully!');
    console.log('   User details:', newUser[0]);
    console.log('\n🔑 Login credentials:');
    console.log('   Email: admin@ufcpicks.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

createAdminUser();
