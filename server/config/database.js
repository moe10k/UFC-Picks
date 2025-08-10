const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // PostgreSQL configuration for production (Heroku)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
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
  // SQLite configuration for development
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ PostgreSQL database connection established successfully.');
      console.log('🌐 Connected to production database');
    } else {
      console.log('✅ SQLite database connection established successfully.');
      console.log(`📁 Database path: ${path.join(__dirname, '..', 'database.sqlite')}`);
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    if (process.env.NODE_ENV === 'production') {
      console.error('💡 Make sure DATABASE_URL is set correctly in your environment variables');
    }
  }
};

module.exports = { sequelize, testConnection }; 