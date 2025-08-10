const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// PostgreSQL connection for writing new data
const postgresSequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

const migrateUFC319 = async () => {
  try {
    console.log('🚀 Starting UFC 319 event migration...');
    
    // Only run in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Migration only runs in production environment');
      return;
    }
    
    // Test PostgreSQL connection
    await postgresSequelize.authenticate();
    console.log('✅ PostgreSQL connection established');
    
    // Check if UFC 319 event already exists in production
    const [existingEvent] = await postgresSequelize.query(
      "SELECT id, name FROM events WHERE name LIKE '%UFC 319%' OR name LIKE '%319%'"
    );
    
    if (existingEvent.length > 0) {
      console.log('⚠️  UFC 319 event already exists in production:');
      existingEvent.forEach(event => {
        console.log(`   - ID: ${event.id}, Name: ${event.name}`);
      });
      return;
    }
    
    // Check if we need to create the events table in production
    const [tables] = await postgresSequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events'"
    );
    
    if (tables.length === 0) {
      console.log('📋 Creating events table in production...');
      await postgresSequelize.query(`
        CREATE TABLE events (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          date TIMESTAMP NOT NULL,
          venue_name VARCHAR(255) NOT NULL,
          venue_city VARCHAR(255) NOT NULL,
          venue_state VARCHAR(255),
          venue_country VARCHAR(255) NOT NULL,
          image TEXT,
          description TEXT,
          status VARCHAR(50) DEFAULT 'upcoming',
          is_active BOOLEAN DEFAULT true,
          pick_deadline TIMESTAMP NOT NULL,
          fights TEXT DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Events table created');
    }
    
    // Create UFC 319 event data (since we can't read from SQLite in production)
    const eventData = {
      name: 'UFC 319',
      date: new Date('2024-12-14T20:00:00Z'), // Set a future date
      venueName: 'TBD',
      venueCity: 'TBD',
      venueState: null,
      venueCountry: 'USA',
      image: null,
      description: 'UFC 319 - Event details to be announced',
      status: 'upcoming',
      isActive: true,
      pickDeadline: new Date('2024-12-13T20:00:00Z'), // 1 day before event
      fights: '[]' // Default empty fights array
    };
    
    // Insert the event into production
    console.log('📝 Inserting UFC 319 event into production...');
    const [newEvent] = await postgresSequelize.query(`
      INSERT INTO events (name, date, venue_name, venue_city, venue_state, venue_country, image, description, status, is_active, pick_deadline, fights, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, name, date, venue_name, status
    `, {
      bind: [
        eventData.name,
        eventData.date,
        eventData.venueName,
        eventData.venueCity,
        eventData.venueState,
        eventData.venueCountry,
        eventData.image,
        eventData.description,
        eventData.status,
        eventData.isActive,
        eventData.pickDeadline,
        eventData.fights
      ]
    });
    
    console.log('🎉 UFC 319 event successfully migrated to production!');
    console.log('📊 Event details:');
    console.log(`   - ID: ${newEvent[0].id}`);
    console.log(`   - Name: ${newEvent[0].name}`);
    console.log(`   - Date: ${newEvent[0].date}`);
    console.log(`   - Venue: ${newEvent[0].venue_name}`);
    console.log(`   - Status: ${newEvent[0].status}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await postgresSequelize.close();
    console.log('🔌 Database connections closed');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUFC319();
}

module.exports = { migrateUFC319 };
