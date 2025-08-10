const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// SQLite connection for reading existing data
const sqliteSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

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
    
    // Test connections
    await sqliteSequelize.authenticate();
    console.log('✅ SQLite connection established');
    
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
    
    // Read UFC 319 event from SQLite
    console.log('📖 Reading UFC 319 event from development database...');
    
    // First, let's see what events exist in SQLite
    const [sqliteEvents] = await sqliteSequelize.query("SELECT * FROM events");
    console.log(`📊 Found ${sqliteEvents.length} events in SQLite database:`);
    sqliteEvents.forEach(event => {
      console.log(`   - ID: ${event.id}, Name: ${event.name}, Date: ${event.date}`);
    });
    
    // Look for UFC 319 specifically
    const ufc319Event = sqliteEvents.find(event => 
      event.name && (event.name.includes('UFC 319') || event.name.includes('319'))
    );
    
    if (!ufc319Event) {
      console.log('❌ UFC 319 event not found in development database');
      console.log('💡 Available events:');
      sqliteEvents.forEach(event => {
        console.log(`   - ${event.name || 'Unnamed event'}`);
      });
      return;
    }
    
    console.log('✅ Found UFC 319 event:', ufc319Event);
    
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
    
    // Prepare the event data for production
    // Since the old model had different fields, we'll need to map them
    const eventData = {
      name: ufc319Event.name,
      date: ufc319Event.date,
      venueName: ufc319Event.location || 'TBD', // Map location to venueName
      venueCity: 'TBD',
      venueState: null,
      venueCountry: 'USA',
      image: null,
      description: `Migrated from development: ${ufc319Event.name}`,
      status: ufc319Event.isCompleted ? 'completed' : 'upcoming',
      isActive: ufc319Event.isActive,
      pickDeadline: new Date(new Date(ufc319Event.date).getTime() - (24 * 60 * 60 * 1000)), // 1 day before event
      fights: '[]' // Default empty fights array
    };
    
    // Insert the event into production
    console.log('📝 Inserting UFC 319 event into production...');
    const [newEvent] = await postgresSequelize.query(`
      INSERT INTO events (name, date, venue_name, venue_city, venue_state, venue_country, image, description, status, is_active, pick_deadline, fights, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      RETURNING id, name, date, venue_name, status
    `, {
      replacements: [
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
    
    // Check if there are any picks for this event that should also be migrated
    const [picks] = await sqliteSequelize.query(
      "SELECT * FROM picks WHERE eventId = ?",
      { replacements: [ufc319Event.id] }
    );
    
    if (picks.length > 0) {
      console.log(`📊 Found ${picks.length} picks for UFC 319`);
      console.log('💡 Note: Picks migration would require additional setup for the new picks model structure');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sqliteSequelize.close();
    await postgresSequelize.close();
    console.log('🔌 Database connections closed');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUFC319();
}

module.exports = { migrateUFC319 };
