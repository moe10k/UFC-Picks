#!/bin/bash

echo "🔧 Fixing crashed Heroku app..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Error: Heroku CLI is not installed"
    echo "💡 Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Get app name from user
echo "📱 Enter your Heroku app name:"
read app_name

if [ -z "$app_name" ]; then
    echo "❌ Error: App name is required"
    exit 1
fi

echo "🔧 Fixing app: $app_name"

# Check if PostgreSQL is already added
if ! heroku addons -a "$app_name" | grep -q "heroku-postgresql"; then
    echo "🗄️ Adding PostgreSQL database..."
    heroku addons:create heroku-postgresql:mini -a "$app_name"
    
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 10
else
    echo "✅ PostgreSQL already exists"
fi

# Set environment variables
echo "🔧 Setting environment variables..."
heroku config:set NODE_ENV=production -a "$app_name"

# Check if JWT_SECRET is set
if [ -z "$(heroku config:get JWT_SECRET -a "$app_name" 2>/dev/null)" ]; then
    echo "🔑 Setting JWT_SECRET..."
    jwt_secret=$(openssl rand -base64 32)
    heroku config:set JWT_SECRET="$jwt_secret" -a "$app_name"
    echo "🔑 Generated JWT secret: $jwt_secret"
else
    echo "✅ JWT_SECRET already set"
fi

# Set CORS origin
heroku config:set CORS_ORIGIN="" -a "$app_name"

# Verify DATABASE_URL
echo "📊 Verifying database configuration..."
database_url=$(heroku config:get DATABASE_URL -a "$app_name")
if [ -n "$database_url" ]; then
    echo "✅ DATABASE_URL is set"
else
    echo "❌ DATABASE_URL is not set. This might cause issues."
fi

# Show current config
echo "📋 Current configuration:"
heroku config -a "$app_name"

# Restart the app
echo "🔄 Restarting the app..."
heroku restart -a "$app_name"

echo "⏳ Waiting for app to start..."
sleep 15

# Check app status
echo "📊 Checking app status..."
heroku ps -a "$app_name"

# Check logs
echo "📋 Recent logs:"
heroku logs --num 20 -a "$app_name"

echo ""
echo "🎉 Fix complete!"
echo "🌐 Your app should be available at: https://$app_name.herokuapp.com"
echo ""
echo "🔧 If you still have issues, check the logs:"
echo "   heroku logs --tail -a $app_name"
echo ""
echo "📊 To check database status:"
echo "   heroku pg:info -a $app_name"
