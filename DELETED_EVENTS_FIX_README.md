# Deleted Events in "My Picks" Fix

## Problem Description

Users were seeing picks for deleted events in their "My Picks" section because:

1. **Events were soft-deleted** (marked as `isActive: false`) but picks remained
2. **"My Picks" route didn't filter** out inactive events
3. **No cleanup mechanism** existed for orphaned picks
4. **Inconsistent filtering** across different routes

## Root Cause

In `server/routes/picks.js`, the "My Picks" and user picks routes were fetching picks without filtering out inactive events:

```javascript
// ❌ PROBLEMATIC: No filter for active events
const picksRaw = await Pick.findAll({
  where: whereClause,
  include: [{
    model: Event,
    as: 'event',
    // Missing: where: { isActive: true }
    attributes: ['id', 'name', 'date', 'status', 'pickDeadline', 'fights']
  }]
});
```

## Solutions Implemented

### 1. **Fixed "My Picks" Route** (`server/routes/picks.js`)

- **Added Event Filter**: Now only shows picks for active events
- **Consistent Behavior**: Both `/my-picks` and `/user/:userId` routes filter properly
- **Clean UI**: Users no longer see picks for deleted events

```javascript
// ✅ FIXED: Only include active events
include: [{
  model: Event,
  as: 'event',
  where: { isActive: true }, // Only include active events
  attributes: ['id', 'name', 'date', 'status', 'pickDeadline', 'fights']
}]
```

### 2. **Enhanced Event Deletion** (`server/routes/events.js`)

- **Soft Delete Option**: Default behavior marks events as inactive (preserves picks)
- **Hard Delete Option**: `?hardDelete=true` completely removes events and picks
- **Flexible Management**: Admins can choose preservation vs. complete removal

```bash
# Soft delete (default) - preserves picks
DELETE /api/events/:id

# Hard delete - removes event and all picks
DELETE /api/events/:id?hardDelete=true
```

### 3. **Added Cleanup Tools** (`server/routes/events.js`)

#### **Orphaned Picks Cleanup**
```bash
# Report orphaned picks (picks for inactive events)
POST /api/events/cleanup-orphaned-picks

# Actually delete orphaned picks
POST /api/events/cleanup-orphaned-picks?action=delete
```

#### **Deleted Events Management**
```bash
# List all deleted/inactive events
GET /api/events/deleted

# Restore a deleted event
POST /api/events/:id/restore
```

### 4. **Updated Statistics Recalculation** (`server/utils/recalculateUserStats.js`)

- **Active Events Only**: Recalculation now only counts picks for active events
- **Accurate Totals**: User statistics reflect only valid, active events
- **Consistent Logic**: All calculation functions use the same filtering

## How to Use the New Features

### **For Regular Users**
- **"My Picks" now only shows active events** - no more deleted event picks
- **Clean interface** - picks for deleted events are automatically hidden

### **For Admins**

#### **Delete an Event**
```bash
# Soft delete (recommended for most cases)
DELETE /api/events/123

# Hard delete (removes everything)
DELETE /api/events/123?hardDelete=true
```

#### **Clean Up Orphaned Picks**
```bash
# First, see what would be cleaned up
POST /api/events/cleanup-orphaned-picks

# Then actually clean up
POST /api/events/cleanup-orphaned-picks?action=delete
```

#### **Manage Deleted Events**
```bash
# See all deleted events
GET /api/events/deleted

# Restore a deleted event
POST /api/events/123/restore
```

## What Gets Fixed

### **Immediate Fixes**
- ✅ "My Picks" no longer shows deleted events
- ✅ User picks routes filter out inactive events
- ✅ Statistics recalculation only counts active events

### **New Admin Capabilities**
- ✅ Flexible event deletion (soft vs. hard)
- ✅ Orphaned picks cleanup tools
- ✅ Deleted events management
- ✅ Event restoration capability

### **Data Integrity**
- ✅ Picks for deleted events are properly hidden
- ✅ User statistics are accurate (only active events)
- ✅ No more orphaned data in the UI

## Best Practices

### **When Deleting Events**
1. **Use soft delete by default** - preserves user data and history
2. **Use hard delete sparingly** - only when you want to completely remove everything
3. **Clean up orphaned picks** - run cleanup after soft-deleting multiple events

### **Event Management**
1. **Check deleted events list** - monitor what's been removed
2. **Restore if needed** - events can be brought back if deleted by mistake
3. **Regular cleanup** - periodically clean up orphaned picks

## Testing the Fix

### **Test "My Picks"**
1. Delete an event (soft delete)
2. Check "My Picks" for users who had picks in that event
3. Verify deleted event picks are no longer visible

### **Test Admin Tools**
1. Try soft delete vs. hard delete
2. Run orphaned picks cleanup
3. Restore a deleted event
4. Verify picks reappear after restoration

## Files Modified

- `server/routes/picks.js` - Fixed "My Picks" filtering
- `server/routes/events.js` - Enhanced deletion and added cleanup tools
- `server/utils/recalculateUserStats.js` - Updated to filter active events

## Impact

- **User Experience**: Clean "My Picks" interface with no deleted events
- **Data Integrity**: Accurate statistics and no orphaned data
- **Admin Control**: Flexible event management and cleanup tools
- **Performance**: Better filtering reduces unnecessary data loading

## Migration Notes

- **Existing deleted events**: Will be hidden from "My Picks" immediately
- **Orphaned picks**: Can be cleaned up using new admin tools
- **User statistics**: May need recalculation if they included deleted events
- **No data loss**: Soft-deleted events can be restored if needed
