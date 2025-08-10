# UFC Picks - Production Deployment Guide

This guide will walk you through deploying your UFC Picks application to Heroku.

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git Repository**: Your code should be in a Git repository

## Pre-Deployment Checklist

- [ ] All environment variables are properly configured
- [ ] Database is ready for production
- [ ] Security measures are in place
- [ ] API endpoints are tested
- [ ] Frontend builds successfully

## Step 1: Prepare Your Application

### 1.1 Environment Variables
Create a `.env` file in your server directory with production values:

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your production values
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=
```

### 1.2 Test Production Build
```bash
# Install all dependencies
npm run install-all

# Build the frontend
npm run build

# Test the production server locally
NODE_ENV=production npm start
```

## Step 2: Deploy to Heroku

### 2.1 Login to Heroku
```bash
heroku login
```

### 2.2 Create Heroku App
```bash
# Create a new Heroku app
heroku create your-ufc-picks-app-name

# Or use an existing app
heroku git:remote -a your-ufc-picks-app-name
```

### 2.3 Set Environment Variables
```bash
# Set production environment
heroku config:set NODE_ENV=production

# Set JWT secret (generate a strong one)
heroku config:set JWT_SECRET=your-super-secret-jwt-key-here

# Set CORS origin (empty for production)
heroku config:set CORS_ORIGIN=

# Set any other environment variables you need
heroku config:set DATABASE_PATH=/app/database.sqlite
```

### 2.4 Deploy Your Code
```bash
# Add all files to git
git add .

# Commit changes
git commit -m "Prepare for production deployment"

# Push to Heroku
git push heroku main

# Or if you're using master branch
git push heroku master
```

### 2.5 Verify Deployment
```bash
# Check app status
heroku ps

# View logs
heroku logs --tail

# Open your app
heroku open
```

## Step 3: Post-Deployment Setup

### 3.1 Initialize Database
```bash
# Run database migrations
heroku run npm run seed

# Check database status
heroku run node -e "require('./config/database.js').testConnection()"
```

### 3.2 Set Up Admin User
```bash
# Run the setup script to create owner/admin user
heroku run node utils/setupOwner.js
```

### 3.3 Verify Application
- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Database operations work
- [ ] Authentication works
- [ ] Admin features function

## Step 4: Monitoring and Maintenance

### 4.1 View Logs
```bash
# Real-time logs
heroku logs --tail

# Recent logs
heroku logs --num 100
```

### 4.2 Monitor Performance
```bash
# Check app metrics
heroku ps

# Monitor dyno usage
heroku ps:scale web=1
```

### 4.3 Update Application
```bash
# Make changes and commit
git add .
git commit -m "Update description"

# Deploy updates
git push heroku main
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Heroku build logs: `heroku logs --tail`
   - Verify all dependencies are in package.json
   - Ensure Node.js version compatibility

2. **Database Issues**
   - SQLite files are ephemeral on Heroku
   - Consider using PostgreSQL for production
   - Check database path configuration

3. **Environment Variables**
   - Verify all required variables are set: `heroku config`
   - Check for typos in variable names
   - Ensure JWT_SECRET is set

4. **CORS Issues**
   - Verify CORS_ORIGIN is properly configured
   - Check if frontend can reach backend API

### Performance Optimization

1. **Enable Compression**
   - Add compression middleware to server
   - Optimize image sizes
   - Use CDN for static assets

2. **Database Optimization**
   - Add database indexes
   - Implement connection pooling
   - Monitor query performance

3. **Caching**
   - Implement Redis for session storage
   - Add response caching
   - Use browser caching headers

## Security Considerations

- [ ] JWT_SECRET is strong and unique
- [ ] Rate limiting is enabled
- [ ] Helmet security headers are active
- [ ] CORS is properly configured
- [ ] Input validation is in place
- [ ] SQL injection protection is active

## Scaling Considerations

- **Horizontal Scaling**: Add more dynos
- **Database**: Migrate to PostgreSQL
- **Caching**: Implement Redis
- **CDN**: Use CloudFlare or similar
- **Monitoring**: Add New Relic or similar

## Support

If you encounter issues:
1. Check Heroku logs: `heroku logs --tail`
2. Verify environment variables: `heroku config`
3. Test locally with production settings
4. Check Heroku status page
5. Review this deployment guide

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure SSL certificates
3. Set up monitoring and alerts
4. Plan for database migration to PostgreSQL
5. Implement CI/CD pipeline
