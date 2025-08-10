#!/bin/bash

echo "🚀 Starting Heroku deployment for UFC Picks..."

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

# Check if we're logged into Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please log into Heroku first:"
    heroku login
fi

# Get app name from user
echo "📱 Enter your Heroku app name (or press Enter to create a new one):"
read app_name

if [ -z "$app_name" ]; then
    echo "🆕 Creating new Heroku app..."
    app_name=$(heroku create --json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Created app: $app_name"
else
    # Check if app exists
    if ! heroku apps:info -a "$app_name" &> /dev/null; then
        echo "❌ Error: App '$app_name' not found"
        echo "💡 Please create it first or check the name"
        exit 1
    fi
    
    # Set the remote
    heroku git:remote -a "$app_name"
fi

echo "🔧 Setting up environment variables..."

# Set production environment
heroku config:set NODE_ENV=production -a "$app_name"

# Generate JWT secret if not provided
echo "🔑 Enter your JWT secret (or press Enter to generate one):"
read jwt_secret

if [ -z "$jwt_secret" ]; then
    jwt_secret=$(openssl rand -base64 32)
    echo "🔑 Generated JWT secret: $jwt_secret"
fi

heroku config:set JWT_SECRET="$jwt_secret" -a "$app_name"

# Set CORS origin
heroku config:set CORS_ORIGIN="" -a "$app_name"

echo "🗄️ Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:mini -a "$app_name"

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

echo "📊 Verifying database configuration..."
heroku config:get DATABASE_URL -a "$app_name"

echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku - $(date)"

echo "📤 Pushing to Heroku..."
git push heroku main

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app should be available at: https://$app_name.herokuapp.com"
    
    echo "🔧 Setting up database..."
    heroku run npm run migrate:sqlite-to-postgres -a "$app_name"
    
    echo "👤 Setting up admin user..."
    heroku run node utils/setupOwner.js -a "$app_name"
    
    echo "🎉 Setup complete! Opening your app..."
    heroku open -a "$app_name"
else
    echo "❌ Deployment failed. Check the logs:"
    echo "heroku logs --tail -a $app_name"
fi
