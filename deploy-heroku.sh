#!/bin/bash

# Heroku Deployment Script for UFC Picks App
# This script automates the deployment process after PostgreSQL migration

echo "🚀 Starting Heroku deployment for UFC Picks App..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server/package.json" ]; then
    echo "❌ Please run this script from the root directory of your project"
    exit 1
fi

# Get app name from user
echo "📝 Enter your Heroku app name (or press Enter to create a new one):"
read app_name

if [ -z "$app_name" ]; then
    echo "🆕 Creating new Heroku app..."
    app_name=$(heroku create --json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Created new app: $app_name"
else
    echo "🔗 Connecting to existing app: $app_name"
    heroku git:remote -a $app_name
fi

# Add PostgreSQL addon
echo "🗄️  Adding PostgreSQL addon..."
heroku addons:create heroku-postgresql:mini -a $app_name

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Get the DATABASE_URL
database_url=$(heroku config:get DATABASE_URL -a $app_name)
echo "✅ Database URL configured"

# Set environment variables
echo "🔧 Setting environment variables..."
heroku config:set NODE_ENV=production -a $app_name
heroku config:set JWT_SECRET="$(openssl rand -base64 32)" -a $app_name
heroku config:set CORS_ORIGIN="https://$app_name.herokuapp.com" -a $app_name
heroku config:set ENABLE_RATE_LIMITING=true -a $app_name
heroku config:set ENABLE_STRICT_CORS=true -a $app_name

# Install dependencies
echo "📦 Installing dependencies..."
cd server
npm install

# Commit changes
echo "💾 Committing changes..."
cd ..
git add .
git commit -m "Migrate to PostgreSQL and prepare for Heroku deployment"

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git push heroku main

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 15

# Check app status
echo "📊 Checking app status..."
heroku ps -a $app_name

# Open the app
echo "🌐 Opening your app in the browser..."
heroku open -a $app_name

echo "🎉 Deployment completed!"
echo "📱 Your app is now live at: https://$app_name.herokuapp.com"
echo ""
echo "📋 Next steps:"
echo "   1. Test all functionality on the live app"
echo "   2. Verify data migration was successful"
echo "   3. Check Heroku logs if you encounter issues: heroku logs --tail -a $app_name"
echo "   4. Set up custom domain if needed"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: heroku logs --tail -a $app_name"
echo "   - Check config: heroku config -a $app_name"
echo "   - Restart app: heroku restart -a $app_name"
echo "   - Check database: heroku pg:info -a $app_name"
