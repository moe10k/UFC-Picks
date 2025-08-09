# Leaderboard Total Points Fix

## Problem Description

The global leaderboard was incorrectly incrementing total points because the scoring system was adding points to existing user totals instead of properly tracking which events had already been scored. This caused:

1. **Double-counting**: When events were re-scored, points were added again instead of replacing
2. **Incorrect totals**: User statistics didn't match their actual pick performance
3. **Misleading rankings**: Leaderboard positions were inaccurate

## Root Cause

In `server/routes/events.js`, the user statistics update logic was:

```javascript
// ❌ PROBLEMATIC: Always adds to existing totals
await user.update({
  totalPoints: user.totalPoints + agg.totalPoints,  // This adds repeatedly!
  // ... other fields
});
```

This meant every time an event was scored (or re-scored), points were added to the user's total instead of being calculated from scratch.

## Solution Implemented

### 1. Fixed Scoring Logic (`server/routes/events.js`)

- **Smart Detection**: Now detects if a user has already been scored for an event
- **Recalculation**: If re-scoring, recalculates totals from all picks instead of adding
- **Prevents Double-counting**: Ensures each event only contributes once to user totals

### 2. Added Validation (`server/routes/leaderboard.js`)

- **Real-time Validation**: Leaderboard now validates displayed totals against actual pick data
- **Discrepancy Detection**: Logs warnings when stored vs. actual totals don't match
- **Accurate Display**: Always shows correct totals even if stored data is wrong

### 3. Created Utility Functions (`server/utils/recalculateUserStats.js`)

- **`recalculateAllUserStats()`**: Fixes all users' statistics from scratch
- **`recalculateUserStats(userId)`**: Fixes a specific user's statistics
- **Comprehensive**: Recalculates all fields: totalPoints, correctPicks, totalPicks, eventsParticipated, bestEventScore

### 4. Admin Routes

- **`POST /api/events/recalculate-stats`**: Recalculate all users' statistics
- **`POST /api/events/recalculate-stats/:userId`**: Recalculate specific user's statistics

### 5. Standalone Fix Script

- **`server/fixUserStats.js`**: Can be run independently to fix existing data

## How to Fix Existing Data

### Option 1: Admin Panel (Recommended)

1. Go to your admin panel
2. Use the new recalculation endpoints to fix all users at once
3. This is the safest option as it runs through your normal API

### Option 2: Standalone Script

```bash
cd server
node fixUserStats.js
```

This script will:
- Connect to your database
- Recalculate all user statistics from their actual picks
- Update the database with correct totals
- Show you exactly what was changed

### Option 3: API Endpoints

```bash
# Fix all users
curl -X POST /api/events/recalculate-stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Fix specific user
curl -X POST /api/events/recalculate-stats/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## What Gets Fixed

The recalculation ensures these fields are accurate:

- **`totalPoints`**: Sum of all points from all scored events
- **`correctPicks`**: Total number of correct fight predictions
- **`totalPicks`**: Total number of fight predictions made
- **`eventsParticipated`**: Number of events user participated in
- **`bestEventScore`**: Highest score achieved in a single event

## Prevention

The new scoring logic prevents future issues by:

1. **Tracking Event Participation**: Knows which events each user has already been scored for
2. **Smart Updates**: Only adds to totals for new events, recalculates for re-scored events
3. **Validation**: Leaderboard validates data in real-time
4. **Logging**: Comprehensive logging shows exactly what's happening during scoring

## Testing

After applying the fix:

1. **Check Leaderboard**: Verify totals match expected values
2. **Re-score an Event**: Ensure points don't double-count
3. **Add New Event**: Verify new points are added correctly
4. **Check Logs**: Look for any discrepancy warnings

## Files Modified

- `server/routes/events.js` - Fixed scoring logic
- `server/routes/leaderboard.js` - Added validation
- `server/utils/recalculateUserStats.js` - New utility functions
- `server/fixUserStats.js` - Standalone fix script

## Files Added

- `server/utils/recalculateUserStats.js`
- `server/fixUserStats.js`
- `LEADERBOARD_FIX_README.md` (this file)

## Impact

- **Immediate**: Fixes existing incorrect totals
- **Long-term**: Prevents future double-counting issues
- **Performance**: Minimal impact (validation only runs on leaderboard requests)
- **Reliability**: Leaderboard always shows accurate data
