const { Sequelize } = require('sequelize');

let sequelize;

// MySQL configuration for all environments
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ufc_picks',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  define: {
    timestamps: true,
    underscored: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// If DATABASE_URL is provided (e.g., from Heroku), use it
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    define: {
      timestamps: true,
      underscored: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  sequelize = new Sequelize(dbConfig);
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL database connection established successfully.');
    console.log(`🌐 Connected to database: ${dbConfig.database}`);
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    console.error('💡 Make sure your MySQL server is running and credentials are correct');
  }
};

module.exports = { sequelize, testConnection }; 