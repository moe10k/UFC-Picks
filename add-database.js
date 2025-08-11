#!/usr/bin/env node

/**
 * Add Database to Heroku Script
 * This script helps you add a database addon to your Heroku app
 */

const { execSync } = require('child_process');

console.log('🚀 Adding Database to Heroku');
console.log('=============================');

function runCommand(command, description) {
  try {
    console.log(`\n🔧 ${description}...`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log('✅ Success!');
    console.log(output);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return false;
  }
}

function checkHerokuCLI() {
  try {
    execSync('heroku --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

console.log('\n📋 Prerequisites Check:');
if (!checkHerokuCLI()) {
  console.log('❌ Heroku CLI not found!');
  console.log('\n💡 Install Heroku CLI first:');
  console.log('   https://devcenter.heroku.com/articles/heroku-cli');
  process.exit(1);
}
console.log('✅ Heroku CLI found');

// Check current app
console.log('\n🔍 Checking current Heroku app...');
try {
  const appInfo = execSync('heroku info --json', { encoding: 'utf8' });
  const app = JSON.parse(appInfo);
  console.log(`✅ Connected to app: ${app.app_name}`);
} catch (error) {
  console.log('❌ No Heroku app found or not logged in');
  console.log('\n💡 Make sure you are:');
  console.log('   1. Logged into Heroku: heroku login');
  console.log('   2. In the correct directory with git remote');
  process.exit(1);
}

// Check current addons
console.log('\n📦 Checking current addons...');
const addons = execSync('heroku addons', { encoding: 'utf8' });
console.log(addons);

// Check if database already exists
if (addons.includes('jawsdb') || addons.includes('heroku-postgresql')) {
  console.log('\n✅ Database addon already exists!');
  console.log('\n🔍 Checking DATABASE_URL...');
  try {
    const dbUrl = execSync('heroku config:get DATABASE_URL', { encoding: 'utf8' });
    console.log('✅ DATABASE_URL is set');
    console.log(`Database: ${dbUrl.trim()}`);
  } catch (error) {
    console.log('❌ DATABASE_URL not found');
  }
} else {
  console.log('\n❌ No database addon found');
  console.log('\n🚀 Adding MySQL database addon...');
  
  if (runCommand('heroku addons:create jawsdb:mini', 'Adding MySQL database addon')) {
    console.log('\n🎉 MySQL database addon created successfully!');
    console.log('\n⏳ Waiting for database to be ready...');
    
    // Wait a moment for the database to be ready
    setTimeout(() => {
      console.log('\n🔍 Verifying DATABASE_URL...');
      try {
        const dbUrl = execSync('heroku config:get DATABASE_URL', { encoding: 'utf8' });
        console.log('✅ DATABASE_URL is now set');
        console.log(`Database: ${dbUrl.trim()}`);
        
        console.log('\n🎯 Next steps:');
        console.log('1. Deploy your updated code:');
        console.log('   git add .');
        console.log('   git commit -m "Add database configuration"');
        console.log('   git push heroku main');
        console.log('\n2. Check the logs:');
        console.log('   heroku logs --tail');
        
      } catch (error) {
        console.log('❌ DATABASE_URL still not found');
        console.log('💡 Try waiting a few minutes and run:');
        console.log('   heroku config:get DATABASE_URL');
      }
    }, 10000); // Wait 10 seconds
    
  } else {
    console.log('\n❌ Failed to create database addon');
    console.log('\n💡 Try manually:');
    console.log('   heroku addons:create jawsdb:mini');
  }
}

console.log('\n📚 For more help, check the HEROKU_DEPLOYMENT_GUIDE.md file');
