# Event Deletion and Cleanup System

## Overview

This document describes the enhanced event deletion and cleanup system that ensures complete removal of event data when events are deleted.

## Problem Solved

Previously, when events were deleted, they were only soft-deleted (marked as inactive) but all associated data (picks, results, etc.) remained in the database. This caused:
- Orphaned picks for deleted events
- Inconsistent data state
- Potential database bloat
- Confusion for users and admins

## Solution Implemented

### 1. Hard Delete by Default
- Events are now hard-deleted by default (completely removed from database)
- All associated picks are automatically deleted
- Foreign key constraints ensure referential integrity

### 2. Enhanced Database Models
- Added proper associations between Event and Pick models
- Implemented CASCADE DELETE constraints
- Events now properly reference their picks

### 3. Admin Cleanup Tools
- **Force Cleanup**: Permanently removes all inactive events and orphaned picks
- **Clean Orphaned Picks**: Removes picks for inactive events only
- **Restore Events**: Allows restoration of soft-deleted events
- **View Deleted Events**: Shows all inactive/soft-deleted events

## API Endpoints

### Event Deletion
```
DELETE /api/events/:id?hardDelete=true
```
- Default behavior: Hard delete (removes event and all picks)
- Use `?hardDelete=false` for soft delete (marks as inactive)

### Cleanup Endpoints
```
POST /api/events/force-cleanup-all
POST /api/events/cleanup-orphaned-picks?action=delete
GET /api/events/deleted
POST /api/events/:id/restore
```

## Frontend Features

### Admin Events Page
- **Force Cleanup Button**: Red button to permanently delete all inactive events
- **Clean Orphaned Picks Button**: Secondary button to clean up orphaned picks
- **Deleted Events Section**: Shows all soft-deleted events with restore options
- **Enhanced Delete Confirmation**: Clear warning about permanent deletion

### User Experience
- Clear confirmation dialogs explaining what will be deleted
- Success messages showing what was cleaned up
- Real-time updates of both active and deleted events

## Database Changes

### Foreign Key Constraints
```javascript
// Event model
Event.hasMany(Pick, { 
  foreignKey: 'event_id', 
  as: 'picks',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Pick model
event_id: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: Event,
    key: 'id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}
```

### Cascading Deletes
- When an event is deleted, all associated picks are automatically removed
- Database-level integrity ensures no orphaned records

## Usage Instructions

### For Admins

1. **Delete an Event**:
   - Click the delete button on any event
   - Confirm the permanent deletion
   - Event and all picks are completely removed

2. **Clean Up Orphaned Data**:
   - Use "Clean Orphaned Picks" to remove picks for inactive events
   - Use "Force Cleanup" to permanently remove all inactive events and picks

3. **Restore Deleted Events**:
   - View deleted events in the "Deleted/Inactive Events" section
   - Click "Restore" to reactivate an event

### For Developers

1. **Testing Cleanup**:
   ```bash
   cd server
   node test-cleanup.js
   ```

2. **API Testing**:
   ```bash
   # Force cleanup all orphaned data
   curl -X POST /api/events/force-cleanup-all \
     -H "Authorization: Bearer <admin-token>"
   
   # Clean orphaned picks only
   curl -X POST /api/events/cleanup-orphaned-picks?action=delete \
     -H "Authorization: Bearer <admin-token>"
   ```

## Safety Features

### Confirmation Dialogs
- All destructive operations require explicit confirmation
- Clear warnings about what will be permanently deleted

### Soft Delete Option
- Events can still be soft-deleted using `?hardDelete=false`
- Soft-deleted events can be restored later

### Audit Trail
- Console logging for all cleanup operations
- Success/failure messages for all operations

## Migration Notes

### Existing Data
- Existing orphaned picks will be visible in the admin interface
- Use cleanup tools to remove old orphaned data
- No data loss for active events

### Database Schema
- New foreign key constraints will be applied on next sync
- Existing data remains intact during migration

## Troubleshooting

### Common Issues

1. **Orphaned Picks Not Cleaning Up**:
   - Check if picks have valid event_id references
   - Verify foreign key constraints are properly set

2. **Events Not Deleting**:
   - Ensure admin privileges
   - Check database connection
   - Verify event exists and is not locked

3. **Restore Not Working**:
   - Check if event still exists in database
   - Verify event is marked as inactive

### Debug Commands
```bash
# Check database state
node test-cleanup.js

# Check server logs for cleanup operations
tail -f server/logs/app.log
```

## Future Enhancements

### Planned Features
- Bulk event operations
- Scheduled cleanup jobs
- Cleanup history and audit logs
- Data export before deletion

### Monitoring
- Database size monitoring
- Orphaned data alerts
- Cleanup operation metrics

## Support

For issues or questions about the cleanup system:
1. Check the console logs for error messages
2. Run the test script to diagnose issues
3. Review the database constraints
4. Contact the development team
