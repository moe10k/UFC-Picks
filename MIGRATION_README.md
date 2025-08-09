# Migration: Remove firstName and lastName Fields

## Overview
This migration removes the `firstName` and `lastName` fields from the user registration and profile system, making username the primary identifier for users.

## Changes Made

### Client-Side Changes
1. **Register.tsx**: Removed firstName and lastName form fields
2. **AuthContext.tsx**: Updated register and updateProfile function signatures
3. **api.ts**: Updated API calls to remove firstName and lastName parameters
4. **types/index.ts**: Updated User interface and related types
5. **Dashboard.tsx**: Updated welcome message to use username
6. **Navbar.tsx**: Updated user display to show username instead of full name
7. **Leaderboard.tsx**: Updated leaderboard to display usernames
8. **Profile.tsx**: Removed firstName and lastName fields from profile form

### Server-Side Changes
1. **User.js**: Removed firstName and lastName fields from User model
2. **auth.js**: Updated registration and profile update routes
3. **picks.js**: Updated user attributes in queries
4. **leaderboard.js**: Updated all leaderboard responses to use username only
5. **seedData.js**: Updated sample user data

## Running the Migration

### Option 1: Fresh Database (Recommended for Development)
If you're starting fresh or don't mind losing existing data:

```bash
# In the server directory
npm run seed
```

This will recreate the database with the new schema.

### Option 2: Migration Script (For Production/Existing Data)
If you have existing data you want to preserve:

```bash
# In the server directory
node utils/migrateRemoveNameFields.js
```

This will remove the firstName and lastName columns from the existing users table.

## Database Schema Changes

### Before
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  avatar VARCHAR,
  isAdmin BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  -- ... stats fields
);
```

### After
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  avatar VARCHAR,
  isAdmin BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  -- ... stats fields
);
```

## User Experience Changes

### Registration
- Users now only need to provide: username, email, and password
- No more firstName and lastName fields

### Profile Display
- User names are now displayed as `@username` instead of "First Last"
- Avatar initials use the first character of the username
- Leaderboard shows usernames instead of full names

### Profile Management
- Users can only update their avatar URL
- No more firstName and lastName editing

## API Changes

### Registration Endpoint
**Before:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**After:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
```

### User Response Objects
**Before:**
```json
{
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "...",
    "stats": {...}
  }
}
```

**After:**
```json
{
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "avatar": "...",
    "stats": {...}
  }
}
```

## Testing

After running the migration, test the following:

1. **Registration**: Create a new account with only username, email, and password
2. **Login**: Verify existing users can still log in
3. **Profile**: Check that user profiles display correctly with username
4. **Leaderboard**: Verify leaderboard shows usernames correctly
5. **Navigation**: Ensure navbar displays username properly

## Rollback

If you need to rollback these changes, you would need to:

1. Add firstName and lastName columns back to the database
2. Revert all the code changes
3. Update existing users to have firstName and lastName values

However, since this is a breaking change, it's recommended to test thoroughly before deploying to production.
