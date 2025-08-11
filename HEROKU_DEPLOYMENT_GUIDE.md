# Heroku Deployment Guide - Fixing Database Connection Issues

## 🚨 Current Issue
Your Heroku app is crashing because it can't connect to the database. The error shows:
```
ECONNREFUSED 127.0.0.1:3306
```

This means the app is trying to connect to a local MySQL instance instead of using Heroku's database.

## 🔧 Fixes Applied

### 1. Updated Database Configuration
- Modified `server/config/database.js` to properly handle both MySQL and Postgres
- Added support for parsing `DATABASE_URL` environment variable
- Added SSL support for production databases
- Improved error handling and logging

### 2. Added Database Dependencies
- Added `pg` and `pg-hstore` for Postgres support
- Kept `mysql2` for MySQL support
- Your app now supports both database types

### 3. Fixed Database Test Endpoint
- Updated `/api/test-db` endpoint to work with both MySQL and Postgres
- Removed database-specific SQL queries
- Used Sequelize methods for database-agnostic operations

## 🚀 Deployment Steps

### Step 1: Add a Database to Heroku
```bash
# Add MySQL
heroku addons:create jawsdb:mini
```

### Step 2: Verify Database Configuration
```bash
# Check if DATABASE_URL is set
heroku config:get DATABASE_URL

# Check your addons
heroku addons
```

### Step 3: Deploy Your Updated Code
```bash
# Commit your changes
git add .
git commit -m "Fix Heroku database connection issues"

# Deploy to Heroku
git push heroku main
```

### Step 4: Test the Connection
```bash
# Run the setup script locally (if you have Heroku CLI)
heroku run node setup-heroku.js

# Or check the logs
heroku logs --tail
```

## 🔍 Troubleshooting

### If DATABASE_URL is still not set:
```bash
# Check your addons
heroku addons

# If no database addon exists, add one:
```

### If connection still fails:
```bash
# Check database status
heroku pg:info

# Check app logs
heroku logs --tail

# Test database connection manually
heroku run node -e "
const { testConnection } = require('./config/database');
testConnection().then(() => console.log('Success')).catch(console.error);
"
```

### If you need to reset the database:
```bash
# Reset the database (WARNING: This will delete all data)
heroku pg:reset DATABASE_URL

# Then redeploy to recreate tables
git push heroku main
```

## 📋 Environment Variables

Make sure these are set in Heroku:
```bash
# Check current config
heroku config

# Set if missing
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secure-jwt-secret
```

## 🎯 Expected Results

After applying these fixes:
1. ✅ App should start without crashing
2. ✅ Database connection should be established
3. ✅ Tables should be created automatically
4. ✅ API endpoints should work properly

## 📞 Need Help?

If you're still having issues:
1. Check the logs: `heroku logs --tail`
2. Run the setup script: `heroku run npm run heroku:setup`
3. Verify your database addon is active
4. Make sure your `DATABASE_URL` is properly set

## 🔄 Alternative: Manual Database Setup

If automatic setup fails, you can manually create tables:
```bash
# Connect to your database
heroku pg:psql
```

---

**Note**: The app will now automatically detect whether you're using MySQL or Postgres based on your `DATABASE_URL` and configure itself accordingly.
