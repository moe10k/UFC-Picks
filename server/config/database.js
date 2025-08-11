const { Sequelize } = require('sequelize');

let sequelize;

// Parse DATABASE_URL to extract connection details
const parseDatabaseUrl = (url) => {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: parsed.port,
      username: parsed.username,
      password: parsed.password,
      database: parsed.pathname.substring(1), // Remove leading slash
    };
  } catch (error) {
    console.error('❌ Error parsing DATABASE_URL:', error);
    return null;
  }
};

// MySQL configuration for local development
const mysqlConfig = {
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

// Debug environment variables
console.log('🔍 Database Configuration Debug:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`JAWSDB_URL: ${process.env.JAWSDB_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'not set'}`);

// Check for database URL (DATABASE_URL or JAWSDB_URL)
const databaseUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL;

if (databaseUrl) {
  console.log('🌐 Using database URL from environment');
  
  const parsedUrl = parseDatabaseUrl(databaseUrl);
  if (parsedUrl) {
    // For JawsDB MySQL, always use mysql dialect
    const dialect = 'mysql';
    
    console.log(`🔗 Connecting to ${dialect} database at ${parsedUrl.host}:${parsedUrl.port}`);
    console.log(`📊 Database: ${parsedUrl.database}`);
    console.log(`🔑 Username: ${parsedUrl.username}`);
    
    const config = {
      dialect: dialect,
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

    // For JawsDB MySQL, SSL is handled automatically
    if (process.env.NODE_ENV === 'production') {
      console.log('🔒 SSL will be handled automatically by JawsDB MySQL');
    }

    console.log('🚀 Creating Sequelize instance with database URL');
    sequelize = new Sequelize(databaseUrl, config);
  } else {
    console.error('❌ Failed to parse database URL, falling back to local config');
    sequelize = new Sequelize(mysqlConfig);
  }
} else {
  console.log('🏠 Using local MySQL configuration');
  console.log('💡 To use Heroku database, add a database addon:');
  console.log('   heroku addons:create jawsdb:mini');
  console.log('   or');
  console.log('   heroku addons:create heroku-postgresql:mini');
  sequelize = new Sequelize(mysqlConfig);
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    const databaseUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL;
    if (databaseUrl) {
      const parsedUrl = parseDatabaseUrl(databaseUrl);
      if (parsedUrl) {
        console.log(`🌐 Connected to ${parsedUrl.protocol} database: ${parsedUrl.database}`);
        console.log(`📍 Host: ${parsedUrl.host}:${parsedUrl.port}`);
      }
    } else {
      console.log(`🌐 Connected to MySQL database: ${mysqlConfig.database}`);
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    const databaseUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL;
    if (databaseUrl) {
      console.error('💡 Check your database URL environment variable');
      console.error('💡 Try: heroku config:get DATABASE_URL or heroku config:get JAWSDB_URL');
      console.error('💡 Make sure you have a database addon:');
      console.error('   heroku addons:create jawsdb:mini');
      console.error('   or');
      console.error('   heroku addons:create heroku-postgresql:mini');
    } else {
      console.error('💡 Make sure your MySQL server is running and credentials are correct');
    }
  }
};

module.exports = { sequelize, testConnection }; 