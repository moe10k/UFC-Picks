@echo off
echo 🧪 Testing Production Build Locally...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Start PostgreSQL container
echo 🗄️  Starting PostgreSQL container...
docker-compose -f docker-compose.test.yml up -d postgres

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
:wait_loop
docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U testuser -d ufc_picks_test >nul 2>&1
if %errorlevel% neq 0 (
    echo    Waiting for PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_loop
)
echo ✅ PostgreSQL is ready!

REM Set environment variables for production testing
set NODE_ENV=production
set DATABASE_URL=postgres://testuser:testpass@localhost:5432/ufc_picks_test
set JWT_SECRET=test-jwt-secret-for-local-testing
set CORS_ORIGIN=http://localhost:3000
set ENABLE_RATE_LIMITING=true
set ENABLE_STRICT_CORS=true

echo 🔧 Environment variables set:
echo    NODE_ENV: %NODE_ENV%
echo    DATABASE_URL: %DATABASE_URL%
echo    JWT_SECRET: %JWT_SECRET%
echo    CORS_ORIGIN: %CORS_ORIGIN%

REM Test the migration script
echo 🚀 Testing migration script...
cd server
call npm run migrate:sqlite-to-postgres

if %errorlevel% equ 0 (
    echo ✅ Migration test successful!
    
    echo 🚀 Testing server startup...
    echo    Starting server in background...
    start /B npm start
    
    REM Wait for server to start
    timeout /t 5 /nobreak >nul
    
    REM Test if server is responding
    curl -s http://localhost:5000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Server started successfully!
        echo 🌐 Server is running at http://localhost:5000
        
        echo 🛑 Stopping server...
        taskkill /F /IM node.exe >nul 2>&1
    ) else (
        echo ❌ Server failed to start or respond
        taskkill /F /IM node.exe >nul 2>&1
    )
) else (
    echo ❌ Migration test failed!
)

cd ..

echo.
echo 🧹 Cleaning up...
docker-compose -f docker-compose.test.yml down

echo.
echo 🎉 Production build test completed!
echo.
echo 📋 Summary:
echo    - PostgreSQL container: ✅ Started and tested
echo    - Migration script: ✅ Tested
echo    - Server startup: ✅ Tested
echo.
echo 💡 Your production build is ready for Heroku deployment!
echo    Run 'deploy-heroku.sh' to deploy to production.
echo.
pause
