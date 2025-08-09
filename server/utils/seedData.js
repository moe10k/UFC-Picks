const Event = require('../models/Event');
const User = require('../models/User');
const { sequelize } = require('../config/database');

const sampleEvents = [
  {
    name: "UFC 319: Du Plessis vs. Chimaev",
    date: new Date('2025-08-16T22:00:00Z'),
    venueName: "T-Mobile Arena",
    venueCity: "Las Vegas",
    venueState: "Nevada",
    venueCountry: "United States",
    description: "UFC 319 features Dricus Du Plessis vs. Khamzat Chimaev in the main event.",
    pickDeadline: new Date('2025-08-16T20:00:00Z'),
    fights: [
      {
        fightNumber: 1,
        weightClass: "Middleweight",
        isMainCard: true,
        isMainEvent: true,
        isCoMainEvent: false,
        fighter1: {
          name: "Dricus Du Plessis",
          nickname: "Stillknocks",
          image: "/fighter-images/dricus-du-plessis.jpg",
          record: { wins: 23, losses: 2, draws: 0 },
          stats: {
            age: 31,
            height: "6'1\"",
            weight: "185 lbs",
            reach: "76\"",
            stance: "Orthodox",
            hometown: "Pretoria, South Africa"
          }
        },
        fighter2: {
          name: "Khamzat Chimaev",
          nickname: "Borz",
          image: "/fighter-images/khamzat-chimaev.jpg",
          record: { wins: 14, losses: 0, draws: 0 },
          stats: {
            age: 31,
            height: "6'2\"",
            weight: "185 lbs",
            reach: "75\"",
            stance: "Orthodox",
            hometown: "Chechnya, Russia"
          }
        },
        isCompleted: false
      },
      {
        fightNumber: 2,
        weightClass: "Featherweight",
        isMainCard: true,
        isMainEvent: false,
        isCoMainEvent: true,
        fighter1: {
          name: "Lerone Murphy",
          nickname: "",
          image: "/fighter-images/lerone-murphy.jpg",
          record: { wins: 16, losses: 0, draws: 1 },
          stats: {}
        },
        fighter2: {
          name: "Aaron Pico",
          nickname: "",
          image: "/fighter-images/aaron-pico.jpg",
          record: { wins: 13, losses: 4, draws: 0 },
          stats: {}
        },
        isCompleted: false
      },
      {
        fightNumber: 3,
        weightClass: "Welterweight",
        isMainCard: true,
        isMainEvent: false,
        isCoMainEvent: false,
        fighter1: {
          name: "Geoff Neal",
          nickname: "",
          image: "/fighter-images/geoff-neal.jpg",
          record: { wins: 16, losses: 6, draws: 0 },
          stats: {}
        },
        fighter2: {
          name: "Carlos Prates",
          nickname: "",
          image: "/fighter-images/carlos-prates.jpg",
          record: { wins: 21, losses: 7, draws: 0 },
          stats: {}
        },
        isCompleted: false
      },
      {
        fightNumber: 4,
        weightClass: "Middleweight",
        isMainCard: true,
        isMainEvent: false,
        isCoMainEvent: false,
        fighter1: {
          name: "Jared Cannonier",
          nickname: "",
          image: "/fighter-images/jared-cannonier.jpg",
          record: { wins: 18, losses: 8, draws: 0 },
          stats: {}
        },
        fighter2: {
          name: "Michael Page",
          nickname: "Venom",
          image: "/fighter-images/michael-page.jpg",
          record: { wins: 23, losses: 3, draws: 0 },
          stats: {}
        },
        isCompleted: false
      },
      {
        fightNumber: 5,
        weightClass: "Flyweight",
        isMainCard: true,
        isMainEvent: false,
        isCoMainEvent: false,
        fighter1: {
          name: "Tim Elliott",
          nickname: "",
          image: "/fighter-images/tim-elliott.jpg",
          record: { wins: 21, losses: 13, draws: 1 },
          stats: {}
        },
        fighter2: {
          name: "Kai Asakura",
          nickname: "",
          image: "/fighter-images/kai-asakura.jpg",
          record: { wins: 21, losses: 5, draws: 0 },
          stats: {}
        },
        isCompleted: false
      }
    ]
  },
];

const sampleUsers = [
  {
    username: "admin",
    email: "admin@ufcpicks.com",
    password: "admin123",
    isAdmin: true
  },
  {
    username: "demo_user",
    email: "demo@ufcpicks.com",
    password: "demo123",
    isAdmin: false
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database to ensure tables exist
    await sequelize.sync({ force: true });

    // Create sample users
    console.log('Creating sample users...');
    const createdUsers = await User.bulkCreate(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create sample events
    console.log('Creating sample events...');
    const createdEvents = await Event.bulkCreate(sampleEvents);
    console.log(`✅ Created ${createdEvents.length} events`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@ufcpicks.com / admin123');
    console.log('Demo: demo@ufcpicks.com / demo123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

module.exports = seedData; 