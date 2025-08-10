const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const pickRoutes = require('./routes/picks');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Heroku (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use X-Forwarded-For header for IP detection on Heroku
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use X-Forwarded-For header for IP detection on Heroku
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? true : 'http://localhost:3000'),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Database connection and sync
const initializeDatabase = async () => {
  try {
    await testConnection();
    await sequelize.sync({ force: false }); // Set force: true to recreate tables
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    if (process.env.NODE_ENV === 'production') {
      console.error('💡 Make sure DATABASE_URL is set correctly in your environment variables');
      console.error('💡 Try: heroku config:get DATABASE_URL');
      process.exit(1);
    }
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/picks', pickRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'UFC Picks API is running' });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Check if users table exists
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");
    
    // Check table structure
    let tableStructure = null;
    if (results.length > 0) {
      const [columns] = await sequelize.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
      tableStructure = columns;
    }
    
    res.json({ 
      status: 'OK', 
      message: 'Database connection successful',
      tables: results.map(r => r.table_name),
      usersTableStructure: tableStructure
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Serve static files from the React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Never expose error details in production
  const errorMessage = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Something went wrong!';
    
  res.status(500).json({ 
    message: errorMessage,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - only for API routes in production
if (process.env.NODE_ENV !== 'production') {
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📊 SQLite database: database.sqlite`);
  });
}); 