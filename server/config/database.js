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
console.log(`DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'not set'}`);

// If DATABASE_URL is provided (e.g., from Heroku), use it
if (process.env.DATABASE_URL) {
  console.log('🌐 Using DATABASE_URL from environment');
  
  const parsedUrl = parseDatabaseUrl(process.env.DATABASE_URL);
  if (parsedUrl) {
    // Determine dialect from protocol
    const dialect = parsedUrl.protocol === 'postgres' ? 'postgres' : 'mysql';
    
    console.log(`🔗 Connecting to ${dialect} database at ${parsedUrl.host}:${parsedUrl.port}`);
    
    sequelize = new Sequelize(process.env.DATABASE_URL, {
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
      },
      dialectOptions: {
        // Add SSL for production databases
        ...(process.env.NODE_ENV === 'production' && {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        })
      }
    });
  } else {
    console.error('❌ Failed to parse DATABASE_URL, falling back to local config');
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
    
    if (process.env.DATABASE_URL) {
      const parsedUrl = parseDatabaseUrl(process.env.DATABASE_URL);
      if (parsedUrl) {
        console.log(`🌐 Connected to ${parsedUrl.protocol} database: ${parsedUrl.database}`);
        console.log(`📍 Host: ${parsedUrl.host}:${parsedUrl.port}`);
      }
    } else {
      console.log(`🌐 Connected to MySQL database: ${mysqlConfig.database}`);
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    if (process.env.DATABASE_URL) {
      console.error('💡 Check your DATABASE_URL environment variable');
      console.error('💡 Try: heroku config:get DATABASE_URL');
    } else {
      console.error('💡 Make sure your MySQL server is running and credentials are correct');
    }
  }
};

module.exports = { sequelize, testConnection }; 