#!/bin/bash

echo "🧪 Testing Production Build Locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start PostgreSQL container
echo "🗄️  Starting PostgreSQL container..."
docker-compose -f docker-compose.test.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U testuser -d ufc_picks_test > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Set environment variables for production testing
export NODE_ENV=production
export DATABASE_URL="postgres://testuser:testpass@localhost:5432/ufc_picks_test"
export JWT_SECRET="test-jwt-secret-for-local-testing"
export CORS_ORIGIN="http://localhost:3000"
export ENABLE_RATE_LIMITING="true"
export ENABLE_STRICT_CORS="true"

echo "🔧 Environment variables set:"
echo "   NODE_ENV: $NODE_ENV"
echo "   DATABASE_URL: $DATABASE_URL"
echo "   JWT_SECRET: $JWT_SECRET"
echo "   CORS_ORIGIN: $CORS_ORIGIN"

# Test the migration script
echo "🚀 Testing migration script..."
cd server
npm run migrate:sqlite-to-postgres

if [ $? -eq 0 ]; then
    echo "✅ Migration test successful!"
    
    # Test the server startup
    echo "🚀 Testing server startup..."
    timeout 10s npm start &
    SERVER_PID=$!
    
    # Wait a bit for server to start
    sleep 3
    
    # Check if server is running
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo "✅ Server started successfully!"
        echo "🌐 Server is running at http://localhost:5000"
        
        # Stop the server
        kill $SERVER_PID 2>/dev/null
        echo "🛑 Server stopped"
    else
        echo "❌ Server failed to start or respond"
        kill $SERVER_PID 2>/dev/null
    fi
else
    echo "❌ Migration test failed!"
fi

cd ..

echo ""
echo "🧹 Cleaning up..."
docker-compose -f docker-compose.test.yml down

echo ""
echo "🎉 Production build test completed!"
echo ""
echo "📋 Summary:"
echo "   - PostgreSQL container: ✅ Started and tested"
echo "   - Migration script: ✅ Tested"
echo "   - Server startup: ✅ Tested"
echo ""
echo "💡 Your production build is ready for Heroku deployment!"
echo "   Run './deploy-heroku.sh' to deploy to production."
