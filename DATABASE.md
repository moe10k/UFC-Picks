# 🗄️ UFC Picks Database Documentation

## 📊 **Current Status: COMPLETED ✅**

**Schema**: Normalized relational database (migrated from JSON-based)  
**Last Updated**: August 23, 2025  
**Status**: Production-ready, fully tested

---

## 🏗️ **Database Schema**

### **Core Tables**
- **`users`** - User accounts (no stats fields)
- **`events`** - UFC events (no fights JSON)
- **`fights`** - Individual fights with fighter details
- **`picks`** - User picks for events (no picks JSON)
- **`pick_details`** - Individual fight predictions
- **`user_stats`** - Computed user statistics

### **Key Relationships**
- `User` ↔ `Pick` ↔ `PickDetail` (one-to-many)
- `Event` ↔ `Fight` (one-to-many)
- `User` ↔ `UserStats` (one-to-one)

---

## 🛡️ **Safe Database Commands**

### **🌱 Seed Database**
```bash
DB_PASSWORD="newpassword123" node -e "
require('./server/utils/seedDataNormalized')().then(() => {
  console.log('✅ Database seeded successfully!');
  process.exit(0);
});
"
```

### **🧪 Test Schema**
```bash
DB_PASSWORD="newpassword123" node server/test-new-schema.js
```

### **📊 Recalculate Stats**
```bash
DB_PASSWORD="newpassword123" node -e "
const recalculator = require('./server/utils/recalculateUserStats');
new recalculator().recalculateAllUserStats();
"
```

### **🔍 Check Status**
```bash
mysql -u root -p ufc_picks -e "
SELECT 'Users' as table, COUNT(*) as count FROM users
UNION ALL SELECT 'Events', COUNT(*) FROM events
UNION ALL SELECT 'Fights', COUNT(*) FROM fights
UNION ALL SELECT 'Picks', COUNT(*) FROM picks
UNION ALL SELECT 'PickDetails', COUNT(*) FROM pick_details
UNION ALL SELECT 'UserStats', COUNT(*) FROM user_stats;
"
```

---

## 🚨 **Critical Safety Rules**

1. **NEVER use `sequelize.sync({ force: true })`** - destroys all data
2. **NEVER run old `manage-database.js`** - deleted for safety
3. **ALWAYS backup before major changes**
4. **Use migrations for schema changes**

---

## 🔧 **Migration & Rollback**

### **Rollback to Old Schema**
```bash
cd server
DB_PASSWORD="newpassword123" node run-migration.js down
```

### **Restore New Schema**
```bash
cd server
DB_PASSWORD="newpassword123" node run-migration.js up
```

> **Note**: Migration is already complete. These commands are for rollback/restore only.

---

## 📝 **Remaining Tasks**

### **API Routes to Update**
- `server/routes/events.js` - Use `fights` relationship
- `server/routes/picks.js` - Use `pickDetails` relationship  
- `server/routes/users.js` - Use `stats` relationship
- `server/routes/leaderboard.js` - Use `UserStats` table

### **Frontend Updates**
- Update components to use new data structure
- Remove JSON parsing logic
- Use `event.fights` array instead of `JSON.parse(event.fights)`

---

## 🔑 **Default Credentials**

- **Admin**: `admin@ufcpicks.com` / `admin123`
- **User1**: `user1@example.com` / `password123`
- **User2**: `user2@example.com` / `password123`

---

## 📁 **Key Files**

- **Models**: `server/models/` (all updated for new schema)
- **Migration**: `server/migrations/001_restructure_database.js`
- **Testing**: `server/test-new-schema.js`
- **Seeding**: `server/utils/seedDataNormalized.js`
- **Stats**: `server/utils/recalculateUserStats.js`

---

## ⚠️ **What Was Deleted**

- `manage-database.js` - Dangerous reset functionality
- `seed-database.js` - Old JSON-based seeding
- `fix-corrupted-events.js` - Old schema references
- `utils/seedData.js` - Old JSON structure

**Database is now 100% safe with normalized structure!** 🎯
