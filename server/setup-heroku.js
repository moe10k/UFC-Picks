#!/usr/bin/env node

/**
 * Heroku Database Setup Script
 * This script helps configure and test your Heroku database connection
 */

const { testConnection } = require('./config/database');

console.log('🚀 Heroku Database Setup Script');
console.log('================================');

// Check environment variables
console.log('\n📋 Environment Check:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`PORT: ${process.env.PORT || 'not set'}`);

if (!process.env.DATABASE_URL) {
  console.log('\n❌ DATABASE_URL is not set!');
  console.log('\n💡 To fix this:');
  console.log('1. Add a database to your Heroku app:');
  console.log('   heroku addons:create heroku-postgresql:mini');
  console.log('   or');
  console.log('   heroku addons:create jawsdb:mini');
  console.log('\n2. Check your current config:');
  console.log('   heroku config:get DATABASE_URL');
  console.log('\n3. If you need to set it manually:');
  console.log('   heroku config:set DATABASE_URL=your_database_url_here');
} else {
  console.log('\n✅ DATABASE_URL is configured');
  console.log('\n🔗 Testing database connection...');
  
  // Test the connection
  testConnection()
    .then(() => {
      console.log('\n🎉 Database connection successful!');
      console.log('\n💡 Your app should now work on Heroku');
    })
    .catch((error) => {
      console.error('\n❌ Database connection failed:', error.message);
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your database addon is active:');
      console.log('   heroku addons');
      console.log('2. Verify your DATABASE_URL:');
      console.log('   heroku config:get DATABASE_URL');
      console.log('3. Check database status:');
      console.log('   heroku pg:info');
    });
}

console.log('\n📚 For more help, check the CLEANUP_README.md file');
