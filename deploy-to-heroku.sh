#!/bin/bash

echo "🚀 UFC Picks Heroku Deployment Script"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   Windows: https://devcenter.heroku.com/articles/heroku-cli"
    echo "   Mac: brew install heroku/brew/heroku"
    echo "   Linux: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo "✅ Heroku CLI found"
echo ""

# Check if user is logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please log in to Heroku first:"
    heroku login
    echo ""
fi

# Get app name
echo "📱 Enter your Heroku app name (or press Enter to use existing):"
read -r app_name

if [ -n "$app_name" ]; then
    echo "🔗 Setting Heroku remote to: $app_name"
    heroku git:remote -a "$app_name"
else
    echo "🔍 Checking for existing Heroku remote..."
    if ! git remote get-url heroku &> /dev/null; then
        echo "❌ No Heroku remote found. Please create an app first:"
        echo "   heroku create your-app-name"
        exit 1
    fi
    echo "✅ Using existing Heroku remote"
fi

echo ""
echo "🔍 Checking current Heroku configuration..."

# Check if database addon exists
if ! heroku addons | grep -q "jawsdb\|postgresql"; then
    echo "❌ No database addon found. Adding JawsDB MySQL..."
    heroku addons:create jawsdb:mini
    echo "✅ JawsDB MySQL addon created"
else
    echo "✅ Database addon found"
fi

# Check NODE_ENV
if [ "$(heroku config:get NODE_ENV 2>/dev/null)" != "production" ]; then
    echo "🔧 Setting NODE_ENV to production..."
    heroku config:set NODE_ENV=production
    echo "✅ NODE_ENV set to production"
else
    echo "✅ NODE_ENV already set to production"
fi

# Check JWT_SECRET
if [ -z "$(heroku config:get JWT_SECRET 2>/dev/null)" ]; then
    echo "🔑 Setting JWT_SECRET..."
    heroku config:set JWT_SECRET="$(openssl rand -base64 32)"
    echo "✅ JWT_SECRET generated and set"
else
    echo "✅ JWT_SECRET already set"
fi

echo ""
echo "📊 Current Heroku configuration:"
heroku config | grep -E "(NODE_ENV|DATABASE_URL|JWT_SECRET)" || echo "No config found"

echo ""
echo "🚀 Deploying to Heroku..."

# Commit changes if needed
if ! git diff-index --quiet HEAD --; then
    echo "📝 Committing changes..."
    git add .
    git commit -m "Deploy to Heroku with database fixes"
fi

# Push to Heroku
echo "⬆️  Pushing to Heroku..."
git push heroku main

echo ""
echo "🔍 Setting up database..."

# Wait a moment for the app to start
sleep 10

# Run database setup
echo "🔄 Running database setup..."
heroku run npm run heroku:setup

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Create admin user: heroku run npm run db:create-admin"
echo "   2. Seed events: heroku run npm run db:seed"
echo "   3. Open your app: heroku open"
echo "   4. Check logs: heroku logs --tail"
echo ""
echo "🌐 Your app should be running at: https://$(heroku info -s | grep web_url | cut -d= -f2)"
