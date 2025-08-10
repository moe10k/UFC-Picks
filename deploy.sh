#!/bin/bash

# UFC Picks - Heroku Deployment Script
# This script automates the deployment process to Heroku

set -e  # Exit on any error

echo "🚀 Starting UFC Picks deployment to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please log in to Heroku first:"
    heroku login
fi

# Get app name from user
echo "📱 Enter your Heroku app name (or press Enter to create a new one):"
read -r app_name

if [ -z "$app_name" ]; then
    echo "🆕 Creating new Heroku app..."
    app_name=$(heroku create --json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Created new app: $app_name"
else
    echo "🔗 Using existing app: $app_name"
    # Check if app exists
    if ! heroku apps:info --app "$app_name" &> /dev/null; then
        echo "❌ App '$app_name' not found. Please check the name and try again."
        exit 1
    fi
fi

# Set up git remote if not already set
if ! git remote | grep -q heroku; then
    echo "🔗 Setting up Heroku git remote..."
    heroku git:remote -a "$app_name"
fi

# Build the application
echo "🔨 Building the application..."
npm run install-all
npm run build

# Set environment variables
echo "⚙️  Setting environment variables..."
heroku config:set NODE_ENV=production --app "$app_name"
heroku config:set JWT_SECRET=$(openssl rand -base64 32) --app "$app_name"
heroku config:set CORS_ORIGIN="" --app "$app_name"

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to production" || true
git push heroku main || git push heroku master

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 10

# Run production setup
echo "🔧 Running production setup..."
heroku run npm run setup --app "$app_name"

# Open the app
echo "🌐 Opening your app..."
heroku open --app "$app_name"

echo "🎉 Deployment completed successfully!"
echo "📱 Your app is now live at: https://$app_name.herokuapp.com"
echo ""
echo "📋 Next steps:"
echo "   1. Test all features of your application"
echo "   2. Change the default admin password"
echo "   3. Set up monitoring and alerts"
echo "   4. Consider migrating to PostgreSQL for production"
echo ""
echo "🔍 To view logs: heroku logs --tail --app $app_name"
echo "⚙️  To check config: heroku config --app $app_name"
