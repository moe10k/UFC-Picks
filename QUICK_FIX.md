# 🚨 QUICK FIX: Heroku Database Connection Issue

## The Problem
Your Heroku app is crashing because it can't connect to a database. The logs show:
```
🏠 Using local MySQL configuration
❌ Unable to connect to database: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
```

## 🎯 Root Cause
Heroku doesn't have a `DATABASE_URL` environment variable set, so your app falls back to trying to connect to localhost MySQL (which doesn't exist on Heroku).

## ⚡ Quick Fix (Choose One)

### Option 1: Add MySQL Database (Recommended)
```bash
# Run this script to automatically add a MySQL database
npm run heroku:add-db

# Or manually:
heroku addons:create jawsdb:mini
```

### Option 2: Add Postgres Database
```bash
heroku addons:create heroku-postgresql:mini
```

### Option 3: Manual Setup
```bash
# Check if you already have a database
heroku addons

# If no database exists, add one:
heroku addons:create jawsdb:mini

# Verify DATABASE_URL is set
heroku config:get DATABASE_URL
```

## 🔄 After Adding Database

1. **Deploy your updated code:**
   ```bash
   git add .
   git commit -m "Fix database connection"
   git push heroku main
   ```

2. **Check the logs:**
   ```bash
   heroku logs --tail
   ```

3. **You should see:**
   ```
   🌐 Using DATABASE_URL from environment
   🔗 Connecting to mysql database at [host]:[port]
   ✅ Database connection established successfully.
   ```

## 🚫 What NOT to Do
- Don't try to connect to localhost MySQL on Heroku
- Don't manually set DATABASE_URL without a database addon
- Don't ignore the database addon requirement

## ✅ Expected Result
After adding a database addon and redeploying:
- App starts successfully
- Database connection established
- Tables created automatically
- No more crashes

## 🆘 Still Having Issues?
1. Check if database addon is active: `heroku addons`
2. Verify DATABASE_URL: `heroku config:get DATABASE_URL`
3. Check logs: `heroku logs --tail`
4. Run setup script: `heroku run npm run heroku:setup`

---

**Time to fix: ~5 minutes**
**Cost: Free tier database addon included**
