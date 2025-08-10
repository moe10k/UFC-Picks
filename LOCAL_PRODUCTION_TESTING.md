# Local Production Testing Guide

This guide shows you how to test your production build locally before deploying to Heroku.

## 🚀 Quick Start (Windows)

1. **Start Docker Desktop** (make sure it's running)
2. **Run the test script**:
   ```cmd
   test-prod-local.bat
   ```

## 🚀 Quick Start (Mac/Linux)

1. **Start Docker** (make sure it's running)
2. **Run the test script**:
   ```bash
   ./test-prod-local.sh
   ```

## 🔧 What the Test Does

The test script will:

1. **Start a PostgreSQL container** using Docker
2. **Set production environment variables** locally
3. **Test the migration script** (SQLite → PostgreSQL)
4. **Test server startup** with PostgreSQL
5. **Clean up** the test environment

## 📋 Prerequisites

- ✅ Docker Desktop installed and running
- ✅ Node.js dependencies installed (`npm install` in server folder)
- ✅ Existing SQLite database with data

## 🧪 Manual Testing (Alternative)

If you prefer to test manually:

### Step 1: Start PostgreSQL Container
```bash
docker-compose -f docker-compose.test.yml up -d postgres
```

### Step 2: Set Environment Variables
```bash
# Windows (Command Prompt)
set NODE_ENV=production
set DATABASE_URL=postgres://testuser:testpass@localhost:5432/ufc_picks_test
set JWT_SECRET=test-jwt-secret-for-local-testing
set CORS_ORIGIN=http://localhost:3000

# Mac/Linux
export NODE_ENV=production
export DATABASE_URL="postgres://testuser:testpass@localhost:5432/ufc_picks_test"
export JWT_SECRET="test-jwt-secret-for-local-testing"
export CORS_ORIGIN="http://localhost:3000"
```

### Step 3: Test Migration
```bash
cd server
npm run migrate:sqlite-to-postgres
```

### Step 4: Test Server
```bash
npm start
```

### Step 5: Clean Up
```bash
cd ..
docker-compose -f docker-compose.test.yml down
```

## 🔍 What to Look For

### ✅ Successful Test Signs:
- PostgreSQL container starts without errors
- Migration script completes with "Migration completed successfully!"
- Server starts and responds to requests
- All data (users, events, picks) is migrated correctly

### ❌ Common Issues:
- **Docker not running**: Start Docker Desktop
- **Port conflicts**: Make sure port 5432 is free
- **Migration errors**: Check if SQLite database exists and has data
- **Server won't start**: Check environment variables and database connection

## 🎯 Testing Specific Features

After the basic test passes, you can manually test:

1. **API Endpoints**: Test your routes with Postman or curl
2. **Authentication**: Test login/register with migrated users
3. **Data Integrity**: Verify all your existing data is accessible
4. **Performance**: Compare response times with SQLite

## 🚀 Next Steps

Once local testing passes:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Production build tested locally - ready for Heroku"
   ```

2. **Deploy to Heroku**:
   ```bash
   ./deploy-heroku.sh
   ```

## 🆘 Troubleshooting

### Docker Issues:
```bash
# Check Docker status
docker info

# Restart Docker Desktop
# (Windows: Restart Docker Desktop application)
```

### Database Connection Issues:
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.test.yml ps

# Check logs
docker-compose -f docker-compose.test.yml logs postgres
```

### Migration Issues:
```bash
# Check if SQLite database exists
ls -la server/database.sqlite

# Check migration script
node server/utils/migrateToPostgres.js
```

---

**💡 Tip**: Run the local test before every major deployment to catch issues early!
