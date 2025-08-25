const Event = require('../models/Event');
const User = require('../models/User');
const Fight = require('../models/Fight');
const Pick = require('../models/Pick');
const PickDetail = require('../models/PickDetail');
const UserStats = require('../models/UserStats');
const { sequelize } = require('../config/database');

// Ensure associations are loaded
const setupAssociations = require('../models/associations');
setupAssociations();

const sampleEvents = [
  {
    name: "UFC 319: Du Plessis vs. Chimaev",
    date: new Date('2025-08-16T22:00:00Z'),
    venueName: "T-Mobile Arena",
    venueCity: "Las Vegas",
    venueState: "Nevada",
    venueCountry: "United States",
    description: "UFC 319 features Dricus Du Plessis vs. Khamzat Chimaev in the main event.",
    pickDeadline: new Date('2025-08-16T20:00:00Z')
  }
];

const sampleFights = [
  {
    fightNumber: 1,
    weightClass: "Middleweight",
    isMainCard: true,
    isMainEvent: true,
    isCoMainEvent: false,
    fighter1Name: "Dricus Du Plessis",
    fighter2Name: "Khamzat Chimaev",
    fighter1Nick: "Stillknocks",
    fighter2Nick: "Borz",
    fighter1Image: "/fighter-images/dricus-du-plessis.jpg",
    fighter2Image: "/fighter-images/khamzat-chimaev.jpg",
    fighter1Record: "23-2-0",
    fighter2Record: "14-0-0",
    isCompleted: false
  },
  {
    fightNumber: 2,
    weightClass: "Featherweight",
    isMainCard: true,
    isMainEvent: false,
    isCoMainEvent: true,
    fighter1Name: "Lerone Murphy",
    fighter2Name: "Aaron Pico",
    fighter1Image: "/fighter-images/lerone-murphy.jpg",
    fighter2Image: "/fighter-images/aaron-pico.jpg",
    fighter1Record: "16-0-1",
    fighter2Record: "13-4-0",
    isCompleted: false
  },
  {
    fightNumber: 3,
    weightClass: "Welterweight",
    isMainCard: true,
    isMainEvent: false,
    isCoMainEvent: false,
    fighter1Name: "Geoff Neal",
    fighter2Name: "Carlos Prates",
    fighter1Image: "/fighter-images/geoff-neal.jpg",
    fighter2Image: "/fighter-images/carlos-prates.jpg",
    fighter1Record: "16-6-0",
    fighter2Record: "21-7-0",
    isCompleted: false
  },
  {
    fightNumber: 4,
    weightClass: "Middleweight",
    isMainCard: true,
    isMainEvent: false,
    isCoMainEvent: false,
    fighter1Name: "Jared Cannonier",
    fighter2Name: "Michael Page",
    fighter2Nick: "Venom",
    fighter1Image: "/fighter-images/jared-cannonier.jpg",
    fighter2Image: "/fighter-images/michael-page.jpg",
    fighter1Record: "18-8-0",
    fighter2Record: "23-3-0",
    isCompleted: false
  },
  {
    fightNumber: 5,
    weightClass: "Flyweight",
    isMainCard: true,
    isMainEvent: false,
    isCoMainEvent: false,
    fighter1Name: "Tim Elliott",
    fighter2Name: "Kai Asakura",
    fighter1Image: "/fighter-images/tim-elliott.jpg",
    fighter2Image: "/fighter-images/kai-asakura.jpg",
    fighter1Record: "21-13-1",
    fighter2Record: "21-5-0",
    isCompleted: false
  }
];

const sampleUsers = [
  {
    username: "admin",
    email: "admin@ufcpicks.com",
    password: "A1!aaaaa",
    isAdmin: true,
    isOwner: true
  }
];

const seedDataNormalized = async () => {
  try {
    console.log('🌱 Starting normalized database seeding...');

    // Sync database to ensure tables exist
    await sequelize.sync({ force: false });

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.username}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`ℹ️  User already exists: ${existingUser.username}`);
      }
    }

    // Create events
    console.log('🥊 Creating events...');
    const createdEvents = [];
    for (const eventData of sampleEvents) {
      const existingEvent = await Event.findOne({ where: { name: eventData.name } });
      if (!existingEvent) {
        const event = await Event.create(eventData);
        createdEvents.push(event);
        console.log(`✅ Created event: ${event.name}`);
      } else {
        createdEvents.push(existingEvent);
        console.log(`ℹ️  Event already exists: ${existingEvent.name}`);
      }
    }

    // Create fights for the first event
    console.log('⚔️ Creating fights...');
    const event = createdEvents[0];
    const createdFights = [];
    
    for (const fightData of sampleFights) {
      const existingFight = await Fight.findOne({ 
        where: { 
          eventId: event.id, 
          fightNumber: fightData.fightNumber 
        } 
      });
      
      if (!existingFight) {
        const fight = await Fight.create({
          ...fightData,
          eventId: event.id
        });
        createdFights.push(fight);
        console.log(`✅ Created fight: ${fight.fighter1Name} vs ${fight.fighter2Name}`);
      } else {
        createdFights.push(existingFight);
        console.log(`ℹ️  Fight already exists: ${existingFight.fighter1Name} vs ${existingFight.fighter2Name}`);
      }
    }

    // No picks created - admin only setup
    console.log('📝 Skipping picks creation - admin only setup');
    const createdPicks = [];

    // No user stats created - admin only setup
    console.log('📊 Skipping user stats creation - admin only setup');

    console.log('\n🎉 Normalized database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Users: ${createdUsers.length} (Admin only)`);
    console.log(`   Events: ${createdEvents.length}`);
    console.log(`   Fights: ${createdFights.length}`);
    console.log(`   Picks: ${createdPicks.length} (None - admin only setup)`);
    console.log('\n🔑 Admin login credentials:');
    console.log('   Admin: admin@ufcpicks.com / A1!aaaaa');
    
  } catch (error) {
    console.error('❌ Error seeding normalized database:', error);
    throw error;
  }
};

module.exports = seedDataNormalized;

// Allow direct execution
if (require.main === module) {
  seedDataNormalized()
    .then(() => {
      console.log('✅ Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
