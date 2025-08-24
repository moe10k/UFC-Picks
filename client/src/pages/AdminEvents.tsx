import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { EventWithFights } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Breadcrumb from '../components/Breadcrumb';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  CalendarIcon, 
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TrashIcon as TrashIconSolid,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getActualEventStatus, getEventStatusColor } from '../utils/eventStatus';

const AdminEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithFights[]>([]);
  const [deletedEvents, setDeletedEvents] = useState<any[]>([]);
  const [orphanedPicksCount, setOrphanedPicksCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
    fetchDeletedEvents();
    checkOrphanedPicks();
  }, []);

  const fetchEvents = async () => {
    try {
      const { events } = await eventsAPI.getAll({ limit: 50 });
      setEvents(events);
      // Also refresh deleted events and orphaned picks count
      fetchDeletedEvents();
      checkOrphanedPicks();
    } catch (error: any) {
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedEvents = async () => {
    try {
      const { deletedEvents } = await eventsAPI.getDeleted();
      setDeletedEvents(deletedEvents);
    } catch (error: any) {
      console.error('Failed to load deleted events:', error);
    }
  };

  const checkOrphanedPicks = async () => {
    try {
      const result = await eventsAPI.checkOrphanedPicks();
      setOrphanedPicksCount(result.totalOrphaned);
      if (result.totalOrphaned > 0) {
        toast(`Found ${result.totalOrphaned} orphaned picks`);
      }
    } catch (error: any) {
      console.error('Failed to check orphaned picks:', error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone. All picks and results for this event will be permanently deleted.')) {
      return;
    }

    try {
      await eventsAPI.delete(eventId.toString(), true);
      toast.success('Event and all associated data deleted successfully');
      fetchEvents();
      fetchDeletedEvents();
      checkOrphanedPicks();
    } catch (error: any) {
      toast.error('Failed to delete event');
    }
  };

  const handleForceCleanup = async () => {
    if (!window.confirm('Are you sure you want to force cleanup all orphaned data? This will permanently delete all inactive events and their associated picks. This action cannot be undone.')) {
      return;
    }

    try {
      await eventsAPI.forceCleanup();
      toast.success('Force cleanup completed successfully');
      fetchEvents();
      fetchDeletedEvents();
      checkOrphanedPicks();
    } catch (error: any) {
      toast.error('Failed to perform force cleanup');
    }
  };

  const handleCleanupOrphanedPicks = async () => {
    if (!window.confirm('Are you sure you want to clean up orphaned picks? This will permanently delete all picks for inactive events. This action cannot be undone.')) {
      return;
    }

    try {
      const result = await eventsAPI.cleanupOrphanedPicks();
      toast.success(`Cleaned up ${result.picksDeleted} orphaned picks`);
      fetchEvents();
      fetchDeletedEvents();
      checkOrphanedPicks();
    } catch (error: any) {
      toast.error('Failed to clean up orphaned picks');
    }
  };

  const handleRestoreEvent = async (eventId: number) => {
    try {
      await eventsAPI.restore(eventId.toString());
      toast.success('Event restored successfully');
      fetchEvents();
      fetchDeletedEvents();
      checkOrphanedPicks();
    } catch (error: any) {
      toast.error('Failed to restore event');
    }
  };

  const handleFixCompletedStatus = async () => {
    if (!window.confirm('This will fix the status of all events that have completed fights but incorrect status. Continue?')) {
      return;
    }

    try {
      const result = await eventsAPI.fixCompletedStatus();
      toast.success(`Fixed ${result.updatedEvents.length} events. Total completed events: ${result.completedEvents}`);
      fetchEvents();
      fetchDeletedEvents();
      checkOrphanedPicks();
    } catch (error: any) {
      toast.error('Failed to fix completed events status');
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    const actualStatus = getActualEventStatus(event);
    return actualStatus === filter;
  });

  // Sort events by status priority: live first, then upcoming, then completed
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const statusA = getActualEventStatus(a);
    const statusB = getActualEventStatus(b);
    
    // Define status priority order
    const statusPriority = { live: 1, upcoming: 2, completed: 3 };
    
    // Sort by status priority first
    if (statusPriority[statusA] !== statusPriority[statusB]) {
      return statusPriority[statusA] - statusPriority[statusB];
    }
    
    // If same status, sort by date (earlier dates first for upcoming, later dates first for completed)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (statusA === 'upcoming') {
      return dateA.getTime() - dateB.getTime(); // Earlier dates first
    } else if (statusA === 'completed') {
      return dateB.getTime() - dateA.getTime(); // Later dates first
    } else {
      return dateA.getTime() - dateB.getTime(); // Earlier dates first for live
    }
  });

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-gray-400">You need administrator privileges to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ name: 'Events' }]} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center mb-2">
            <CalendarIcon className="w-8 h-8 text-ufc-gold mr-3" />
            <h1 className="text-4xl font-bold text-white">Event Management</h1>
          </div>
          <p className="text-gray-400">Manage all UFC events and fights</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleFixCompletedStatus}
            className="btn-secondary flex items-center"
            title="Fix the status of events that have completed fights but incorrect status"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Fix Completed Events
          </button>
          <button
            onClick={handleCleanupOrphanedPicks}
            className="btn-secondary flex items-center"
            title="Clean up orphaned picks for inactive events"
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            Clean Orphaned Picks
            {orphanedPicksCount > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {orphanedPicksCount}
              </span>
            )}
          </button>
          <button
            onClick={handleForceCleanup}
            className="btn-danger flex items-center"
            title="Force cleanup all orphaned data"
          >
            <TrashIconSolid className="w-5 h-5 mr-2" />
            Force Cleanup
          </button>
          <Link
            to="/admin/events/create"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create New Event
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Filter Events</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-ufc-red text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'upcoming' 
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Upcoming ({events.filter(e => getActualEventStatus(e) === 'upcoming').length})
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'live' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Live ({events.filter(e => getActualEventStatus(e) === 'live').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Completed ({events.filter(e => getActualEventStatus(e) === 'completed').length})
          </button>
        </div>
      </div>

      {/* Deleted Events Section */}
      {deletedEvents.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Deleted/Inactive Events ({deletedEvents.length})</h2>
          <div className="space-y-3">
            {deletedEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">{event.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Deleted: {new Date(event.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRestoreEvent(event.id)}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={handleForceCleanup}
              className="btn-danger text-sm px-3 py-2 flex items-center"
              title="Permanently delete all inactive events and their picks"
            >
              <TrashIconSolid className="w-4 h-4 mr-2" />
              Permanent Delete All
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {sortedEvents.map((event) => {
          const totalFights = event.fights.length;
          
          return (
            <div key={event.id} className="card hover:bg-gray-750 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-xl font-bold text-white">{event.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEventStatusColor(getActualEventStatus(event))}`}>
                      {getActualEventStatus(event)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <span className="font-medium text-white">Date:</span> {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-2" />
                      <span className="font-medium text-white">Venue:</span> {event.venue.name}
                    </div>
                    <div className="flex items-center">
                      <ChartBarIcon className="w-4 h-4 mr-2" />
                      <span className="font-medium text-white">Fights:</span> {totalFights}
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-400">{event.description}</p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="btn-secondary text-sm px-4 py-2 flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/results`}
                    className="btn-primary text-sm px-4 py-2 flex items-center"
                  >
                    <ChartBarIcon className="w-4 h-4 mr-2" />
                    Enter Results
                  </Link>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="btn-danger text-sm px-4 py-2 flex items-center"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {sortedEvents.length === 0 && (
          <div className="card text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-gray-400 mb-4">
              {filter === 'all' 
                ? 'No events have been created yet.' 
                : `No ${filter} events found.`
              }
            </p>
            <Link to="/admin/events/create" className="btn-primary flex items-center mx-auto w-fit">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvents;
