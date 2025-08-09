import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Breadcrumb from '../components/Breadcrumb';
import toast from 'react-hot-toast';

const AdminResults: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { events } = await eventsAPI.getAll({ limit: 50 });
      setEvents(events);
    } catch (error: any) {
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

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

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'completed') return event.status === 'completed';
    if (filter === 'upcoming') return event.status === 'upcoming';
    if (filter === 'live') return event.status === 'live';
    return true;
  });

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-green-600 text-white';
      case 'completed': return 'bg-blue-600 text-white';
      case 'live': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getResultsStatus = (event: Event) => {
    const completedFights = event.fights.filter(fight => fight.isCompleted).length;
    const totalFights = event.fights.length;
    
    if (completedFights === 0) {
      return { text: 'No Results', color: 'text-gray-400', bgColor: 'bg-gray-700' };
    } else if (completedFights === totalFights) {
      return { text: 'Complete', color: 'text-green-400', bgColor: 'bg-green-700' };
    } else {
      return { text: 'Partial', color: 'text-yellow-400', bgColor: 'bg-yellow-700' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ name: 'Update Results' }]} />
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Update Fight Results</h1>
        <p className="text-gray-400">
          Select an event to enter or update fight results
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' 
                ? 'bg-ufc-red text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'upcoming' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Upcoming ({events.filter(e => e.status === 'upcoming').length})
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'live' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Live ({events.filter(e => e.status === 'live').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'completed' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Completed ({events.filter(e => e.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => {
          const resultsStatus = getResultsStatus(event);
          const completedFights = event.fights.filter(fight => fight.isCompleted).length;
          const totalFights = event.fights.length;
          
          return (
            <div key={event.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-bold text-white">{event.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEventStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${resultsStatus.bgColor}`}>
                      {resultsStatus.text}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-3">
                    <div>
                      <span className="font-medium text-white">Date:</span> {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium text-white">Venue:</span> {event.venue.name}
                    </div>
                    <div>
                      <span className="font-medium text-white">Fights:</span> {totalFights}
                    </div>
                    <div>
                      <span className="font-medium text-white">Results:</span> {completedFights}/{totalFights}
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-400">{event.description}</p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    to={`/admin/events/${event.id}/results`}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    {completedFights === 0 ? 'Enter Results' : 'Update Results'}
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Edit Event
                  </Link>
                </div>
              </div>
              
              {/* Progress bar for results completion */}
              {totalFights > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Results Progress</span>
                    <span>{completedFights}/{totalFights} fights completed</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-ufc-red h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedFights / totalFights) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredEvents.length === 0 && (
          <div className="card text-center py-12">
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-gray-400 mb-4">
              {filter === 'all' 
                ? 'No events have been created yet.' 
                : `No ${filter} events found.`
              }
            </p>
            <Link to="/admin/events/create" className="btn-primary">
              Create Your First Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResults;
