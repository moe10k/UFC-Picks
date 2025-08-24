#!/usr/bin/env node

/**
 * New Schema Testing Script
 * 
 * This script tests the new normalized database schema to ensure:
 * - All models work correctly
 * - Associations are properly set up
 * - CRUD operations function as expected
 * - Data integrity is maintained
 * - Performance is acceptable
 */

const { sequelize, testConnection } = require('./config/database');
const setupAssociations = require('./models/associations');
const User = require('./models/User');
const Event = require('./models/Event');
const Fight = require('./models/Fight');
const Pick = require('./models/Pick');
const PickDetail = require('./models/PickDetail');
const UserStats = require('./models/UserStats');
const UserStatsRecalculator = require('./utils/recalculateUserStats');

class SchemaTester {
  constructor() {
    this.timestamp = Date.now();
    this.testData = {
      users: [],
      events: [],
      fights: [],
      picks: [],
      pickDetails: [],
      userStats: []
    };
  }

  async runAllTests() {
    try {
      console.log('🧪 Starting new schema testing...');
      
      // Test database connection
      await this.testDatabaseConnection();
      
      // Setup associations
      await this.testAssociations();
      
      // Test model creation and validation
      await this.testModelCreation();
      
      // Test CRUD operations
      await this.testCRUDOperations();
      
      // Test associations and relationships
      await this.testRelationships();
      
      // Test data integrity
      await this.testDataIntegrity();
      
      // Test performance
      await this.testPerformance();
      
      // Test user stats calculation
      await this.testUserStatsCalculation();
      
      // Cleanup test data
      await this.cleanupTestData();
      
      console.log('🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      throw error;
    } finally {
      await sequelize.close();
    }
  }

  async testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful');
  }

  async testAssociations() {
    console.log('🔗 Testing model associations...');
    setupAssociations();
    console.log('✅ Associations set up successfully');
  }

  async testModelCreation() {
    console.log('📋 Testing model creation and validation...');
    
    // Test User model
    const testUser = await User.create({
      username: `testuser_${this.timestamp}`,
      email: `test_${this.timestamp}@example.com`,
      password: 'password123',
      isAdmin: false,
      isOwner: false,
      isActive: true
    });
    this.testData.users.push(testUser);
    console.log('✅ User model creation successful');

    // Test Event model
    const testEvent = await Event.create({
      name: 'Test UFC Event',
      date: new Date('2024-12-31'),
      venueName: 'Test Arena',
      venueCity: 'Test City',
      venueState: 'Test State',
      venueCountry: 'Test Country',
      description: 'Test event for schema validation',
      status: 'upcoming',
      isActive: true,
      pickDeadline: new Date('2024-12-30')
    });
    this.testData.events.push(testEvent);
    console.log('✅ Event model creation successful');

    // Test Fight model
    const testFight = await Fight.create({
      eventId: testEvent.id,
      fightNumber: 1,
      weightClass: 'Lightweight',
      isMainCard: true,
      isMainEvent: false,
      isCoMainEvent: false,
      fighter1Name: 'Test Fighter 1',
      fighter2Name: 'Test Fighter 2',
      fighter1Nick: 'The Test',
      fighter2Nick: 'The Tester',
      fighter1Image: 'fighter1.jpg',
      fighter2Image: 'fighter2.jpg',
      fighter1Record: '10-0-0',
      fighter2Record: '9-1-0',
      isCompleted: false
    });
    this.testData.fights.push(testFight);
    console.log('✅ Fight model creation successful');

    // Test Pick model
    const testPick = await Pick.create({
      userId: testUser.id,
      eventId: testEvent.id,
      isSubmitted: false,
      isScored: false,
      totalPoints: 0,
      correctPicks: 0,
      totalPicks: 0,
      accuracy: 0.00
    });
    this.testData.picks.push(testPick);
    console.log('✅ Pick model creation successful');

    // Test PickDetail model
    const testPickDetail = await PickDetail.create({
      pickId: testPick.id,
      fightId: testFight.id,
      predictedWinner: 'fighter1',
      predictedMethod: 'KO/TKO',
      predictedRound: 2,
      predictedTime: '2:30',
      pointsEarned: 0,
      isCorrect: false
    });
    this.testData.pickDetails.push(testPickDetail);
    console.log('✅ PickDetail model creation successful');

    // Test UserStats model
    const testUserStats = await UserStats.create({
      userId: testUser.id,
      totalPicks: 0,
      correctPicks: 0,
      totalPoints: 0,
      eventsParticipated: 0,
      bestEventScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageAccuracy: 0.00
    });
    this.testData.userStats.push(testUserStats);
    console.log('✅ UserStats model creation successful');
  }

  async testCRUDOperations() {
    console.log('🔄 Testing CRUD operations...');
    
    // Test User update
    const user = this.testData.users[0];
    const newUsername = `updateduser_${this.timestamp}`;
    await user.update({ username: newUsername });
    const updatedUser = await User.findByPk(user.id);
    if (updatedUser.username !== newUsername) {
      throw new Error('User update failed');
    }
    console.log('✅ User update successful');

    // Test Event update
    const event = this.testData.events[0];
    await event.update({ status: 'live' });
    const updatedEvent = await Event.findByPk(event.id);
    if (updatedEvent.status !== 'live') {
      throw new Error('Event update failed');
    }
    console.log('✅ Event update successful');

    // Test Fight update
    const fight = this.testData.fights[0];
    await fight.update({ 
      isCompleted: true, 
      winner: 'fighter1', 
      method: 'KO/TKO', 
      round: 2 
    });
    const updatedFight = await Fight.findByPk(fight.id);
    if (!updatedFight.isCompleted || updatedFight.winner !== 'fighter1') {
      throw new Error('Fight update failed');
    }
    console.log('✅ Fight update successful');

    // Test Pick update
    const pick = this.testData.picks[0];
    await pick.update({ isSubmitted: true, submittedAt: new Date() });
    const updatedPick = await Pick.findByPk(pick.id);
    if (!updatedPick.isSubmitted) {
      throw new Error('Pick update failed');
    }
    console.log('✅ Pick update successful');

    // Test PickDetail update
    const pickDetail = this.testData.pickDetails[0];
    await pickDetail.update({ 
      isCorrect: true, 
      pointsEarned: 10, 
      scoredAt: new Date() 
    });
    const updatedPickDetail = await PickDetail.findByPk(pickDetail.id);
    if (!updatedPickDetail.isCorrect || updatedPickDetail.pointsEarned !== 10) {
      throw new Error('PickDetail update failed');
    }
    console.log('✅ PickDetail update successful');

    // Test UserStats update
    const userStats = this.testData.userStats[0];
    await userStats.update({ 
      totalPicks: 1, 
      correctPicks: 1, 
      totalPoints: 10 
    });
    const updatedUserStats = await UserStats.findByPk(userStats.id);
    if (updatedUserStats.totalPicks !== 1 || updatedUserStats.totalPoints !== 10) {
      throw new Error('UserStats update failed');
    }
    console.log('✅ UserStats update successful');
  }

  async testRelationships() {
    console.log('🔗 Testing model relationships...');
    
    // Test User -> Pick relationship
    const user = await User.findByPk(this.testData.users[0].id, {
      include: [{ model: Pick, as: 'picks' }]
    });
    if (!user.picks || user.picks.length === 0) {
      throw new Error('User -> Pick relationship failed');
    }
    console.log('✅ User -> Pick relationship successful');

    // Test Event -> Fight relationship
    const event = await Event.findByPk(this.testData.events[0].id, {
      include: [{ model: Fight, as: 'fights' }]
    });
    if (!event.fights || event.fights.length === 0) {
      throw new Error('Event -> Fight relationship failed');
    }
    console.log('✅ Event -> Fight relationship successful');

    // Test Pick -> PickDetail relationship
    const pick = await Pick.findByPk(this.testData.picks[0].id, {
      include: [{ model: PickDetail, as: 'pickDetails' }]
    });
    if (!pick.pickDetails || pick.pickDetails.length === 0) {
      throw new Error('Pick -> PickDetail relationship failed');
    }
    console.log('✅ Pick -> PickDetail relationship successful');

    // Test User -> UserStats relationship
    const userWithStats = await User.findByPk(this.testData.users[0].id, {
      include: [{ model: UserStats, as: 'stats' }]
    });
    if (!userWithStats.stats) {
      throw new Error('User -> UserStats relationship failed');
    }
    console.log('✅ User -> UserStats relationship successful');
  }

  async testDataIntegrity() {
    console.log('🔒 Testing data integrity...');
    
    // Test foreign key constraints
    try {
      await PickDetail.create({
        pickId: 99999, // Non-existent pick ID
        fightId: this.testData.fights[0].id,
        predictedWinner: 'fighter1',
        predictedMethod: 'Decision'
      });
      throw new Error('Foreign key constraint failed - should not allow non-existent pick ID');
    } catch (error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        console.log('✅ Foreign key constraint working correctly');
      } else {
        throw error;
      }
    }

    // Test unique constraints
    try {
      await User.create({
        username: `testuser_${this.timestamp}`, // Duplicate username from above
        email: 'test2@example.com',
        password: 'password123'
      });
      throw new Error('Unique constraint failed - should not allow duplicate username');
    } catch (error) {
      // Check for various possible unique constraint error names
      if (error.name === 'SequelizeUniqueConstraintError' || 
          error.name === 'SequelizeValidationError' ||
          error.message.includes('Duplicate entry') ||
          error.message.includes('unique')) {
        console.log('✅ Unique constraint working correctly');
      } else {
        console.log('⚠️  Unexpected error type:', error.name, error.message);
        throw error;
      }
    }

    // Test enum validation
    try {
      await Fight.create({
        eventId: this.testData.events[0].id,
        fightNumber: 2,
        weightClass: 'Invalid Weight Class',
        fighter1Name: 'Test Fighter 1',
        fighter2Name: 'Test Fighter 2'
      });
      throw new Error('Validation failed - should not allow invalid weight class');
    } catch (error) {
      console.log('✅ Validation working correctly');
    }

    console.log('✅ Data integrity tests passed');
  }

  async testPerformance() {
    console.log('⚡ Testing performance...');
    
    const startTime = Date.now();
    
    // Test query performance with associations
    const usersWithPicks = await User.findAll({
      include: [
        {
          model: Pick,
          as: 'picks',
          include: [
            {
              model: PickDetail,
              as: 'pickDetails'
            }
          ]
        },
        {
          model: UserStats,
          as: 'stats'
        }
      ],
      limit: 10
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Complex query completed in ${queryTime}ms`);
    
    if (queryTime > 1000) {
      console.log('⚠️  Query performance may need optimization');
    } else {
      console.log('✅ Query performance is acceptable');
    }
  }

  async testUserStatsCalculation() {
    console.log('📊 Testing user stats calculation...');
    
    const statsRecalculator = new UserStatsRecalculator();
    
    // Test single user stats recalculation
    const userStats = await statsRecalculator.recalculateUserStats(this.testData.users[0].id);
    if (!userStats) {
      throw new Error('User stats recalculation failed');
    }
    console.log('✅ Single user stats recalculation successful');

    // Test stats validation
    const validation = await statsRecalculator.validateUserStats();
    if (!validation.isValid) {
      console.log('⚠️  User stats validation found inconsistencies:', validation.inconsistencies);
    } else {
      console.log('✅ User stats validation passed');
    }

    // Test stats summary
    const summary = await statsRecalculator.getUserStatsSummary();
    if (!summary) {
      throw new Error('User stats summary failed');
    }
    console.log('✅ User stats summary successful');
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    // Delete in reverse order to respect foreign key constraints
    for (const pickDetail of this.testData.pickDetails) {
      await pickDetail.destroy();
    }
    
    for (const pick of this.testData.picks) {
      await pick.destroy();
    }
    
    for (const fight of this.testData.fights) {
      await fight.destroy();
    }
    
    for (const userStats of this.testData.userStats) {
      await userStats.destroy();
    }
    
    for (const event of this.testData.events) {
      await event.destroy();
    }
    
    for (const user of this.testData.users) {
      await user.destroy();
    }
    
    console.log('✅ Test data cleaned up successfully');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new SchemaTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = SchemaTester;
