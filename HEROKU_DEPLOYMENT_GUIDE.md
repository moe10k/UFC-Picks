# 🚀 Heroku Deployment Guide for UFC Picks

This guide will help you deploy your UFC Picks application to Heroku successfully.

## 🚨 Current Issue
Your app is trying to connect to a local MySQL database (`127.0.0.1:3306`) on Heroku, which doesn't exist. You need to use a cloud database service.

## 🔧 Quick Fix Steps

### 1. Add a Database Addon to Heroku

**Option A: JawsDB MySQL (Recommended for your current setup)**
```bash
heroku addons:create jawsdb:mini
```

**Option B: PostgreSQL (Heroku's default)**
```bash
heroku addons:create heroku-postgresql:mini
```

### 2. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
```

### 3. Verify Database Configuration
```bash
heroku config:get DATABASE_URL
```

### 4. Deploy Your Changes
```bash
git add .
git commit -m "Fix database configuration for Heroku"
git push heroku main
```

## 📋 Complete Deployment Process

### Step 1: Prepare Your Local Environment
```bash
# Make sure you're in the project root
cd "UFC Picks"

# Check if you have Heroku CLI installed
heroku --version

# If not installed, install it:
# Windows: https://devcenter.heroku.com/articles/heroku-cli
# Mac: brew install heroku/brew/heroku
```

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App (if not already created)
```bash
heroku create your-app-name
# or use existing app
heroku git:remote -a your-app-name
```

### Step 4: Add Database Addon
```bash
# For MySQL (recommended)
heroku addons:create jawsdb:mini

# For PostgreSQL
heroku addons:create heroku-postgresql:mini
```

### Step 5: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-jwt-key-here
```

### Step 6: Deploy Your Application
```bash
git add .
git commit -m "Deploy to Heroku with database fixes"
git push heroku main
```

### Step 7: Setup Database
```bash
# Run the setup script
heroku run npm run heroku:setup

# Create admin user
heroku run npm run db:create-admin

# Seed events (optional)
heroku run npm run db:seed
```

### Step 8: Verify Deployment
```bash
# Check app status
heroku ps

# View logs
heroku logs --tail

# Open your app
heroku open
```

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check if DATABASE_URL is set
heroku config:get DATABASE_URL

# Check database addon status
heroku addons

# View database info
heroku pg:info  # for PostgreSQL
# or check JawsDB status in Heroku dashboard
```

### App Crashes
```bash
# View recent logs
heroku logs --tail

# Check app status
heroku ps

# Restart app if needed
heroku restart
```

### Common Error: "App crashed"
- Check if DATABASE_URL is properly set
- Verify database addon is active
- Check logs for specific error messages
- Ensure NODE_ENV is set to production

## 📊 Database Management Commands

```bash
# Check database status
heroku run npm run db:status

# Create admin user
heroku run npm run db:create-admin

# Seed database with events
heroku run npm run db:seed

# Reset database (⚠️ WARNING: deletes all data)
heroku run npm run db:reset
```

## 🌐 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | ✅ |
| `DATABASE_URL` | Database connection string | ✅ (auto-set by addon) |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `PORT` | Server port | ❌ (auto-set by Heroku) |

## 💡 Pro Tips

1. **Use JawsDB MySQL** if you want to keep your current MySQL setup
2. **Use PostgreSQL** if you want to switch to Heroku's default database
3. **Always check logs** when something goes wrong: `heroku logs --tail`
4. **Test locally** with production environment variables before deploying
5. **Keep your JWT_SECRET** secure and unique for each environment

## 🆘 Still Having Issues?

1. Check the logs: `heroku logs --tail`
2. Verify database addon is active: `heroku addons`
3. Ensure DATABASE_URL is set: `heroku config:get DATABASE_URL`
4. Check if NODE_ENV is production: `heroku config:get NODE_ENV`

## 📚 Additional Resources

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [JawsDB MySQL Documentation](https://devcenter.heroku.com/articles/jawsdb)
- [Heroku PostgreSQL Documentation](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Sequelize Documentation](https://sequelize.org/)

---

**Need help?** Check the logs first, then refer to this guide. Most issues are related to database configuration or missing environment variables.
