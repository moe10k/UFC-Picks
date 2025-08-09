import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  TrophyIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { events } = await eventsAPI.getAll({ limit: 10 });
        setEvents(events);
      } catch (error: any) {
        toast.error('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  const completedEvents = events.filter(event => event.status === 'completed');
  const liveEvents = events.filter(event => event.status === 'live');
  const eventsNeedingResults = events.filter(event => 
    event.status === 'completed' && 
    event.fights.some(fight => !fight.isCompleted)
  );

  const quickActions = [
    {
      title: 'Create New Event',
      description: 'Add a new UFC event with fights',
      icon: PlusIcon,
      href: '/admin/events/create',
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-green-100'
    },
    {
      title: 'Manage Events',
      description: 'Edit existing events and fights',
      icon: CalendarIcon,
      href: '/admin/events',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-100'
    },
    {
      title: 'Update Results',
      description: 'Enter fight results and score picks',
      icon: ChartBarIcon,
      href: '/admin/results',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      textColor: 'text-yellow-100'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mr-4">
            <Cog6ToothIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-gray-400 text-lg">
          Manage UFC events, fights, and results
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="flex items-center justify-center mb-3">
            <CalendarIcon className="w-8 h-8 text-blue-200" />
          </div>
          <h3 className="text-lg font-semibold text-blue-100 mb-2">Total Events</h3>
          <p className="text-3xl font-bold text-white">{events.length}</p>
        </div>
        
        <div className="card text-center bg-gradient-to-br from-green-600 to-green-700">
          <div className="flex items-center justify-center mb-3">
            <ClockIcon className="w-8 h-8 text-green-200" />
          </div>
          <h3 className="text-lg font-semibold text-green-100 mb-2">Upcoming</h3>
          <p className="text-3xl font-bold text-white">{upcomingEvents.length}</p>
        </div>
        
        <div className="card text-center bg-gradient-to-br from-red-600 to-red-700">
          <div className="flex items-center justify-center mb-3">
            <TrophyIcon className="w-8 h-8 text-red-200" />
          </div>
          <h3 className="text-lg font-semibold text-red-100 mb-2">Live</h3>
          <p className="text-3xl font-bold text-white">{liveEvents.length}</p>
        </div>
        
        <div className="card text-center bg-gradient-to-br from-purple-600 to-purple-700">
          <div className="flex items-center justify-center mb-3">
            <CheckCircleIcon className="w-8 h-8 text-purple-200" />
          </div>
          <h3 className="text-lg font-semibold text-purple-100 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-white">{completedEvents.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Cog6ToothIcon className="w-6 h-6 mr-3 text-ufc-gold" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={`${action.color} rounded-lg p-6 text-center transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex items-center justify-center mb-4">
                <action.icon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
              <p className={`${action.textColor} text-sm`}>{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {(eventsNeedingResults.length > 0 || liveEvents.length > 0) && (
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <TrophyIcon className="w-6 h-6 mr-3 text-ufc-gold" />
            Action Required
          </h2>
          <div className="space-y-4">
            {liveEvents.length > 0 && (
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <div className="flex items-center">
                  <TrophyIcon className="w-6 h-6 text-red-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-red-200">Live Events</h3>
                    <p className="text-red-300 text-sm">
                      {liveEvents.length} event{liveEvents.length > 1 ? 's' : ''} currently live - 
                      consider updating results as fights complete
                    </p>
                  </div>
                  <Link 
                    to="/admin/results" 
                    className="ml-auto btn-primary text-sm px-4 py-2"
                  >
                    Update Results
                  </Link>
                </div>
              </div>
            )}
            
            {eventsNeedingResults.length > 0 && (
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="w-6 h-6 text-yellow-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-yellow-200">Results Pending</h3>
                    <p className="text-yellow-300 text-sm">
                      {eventsNeedingResults.length} completed event{eventsNeedingResults.length > 1 ? 's' : ''} 
                      with missing fight results
                    </p>
                  </div>
                  <Link 
                    to="/admin/results" 
                    className="ml-auto btn-primary text-sm px-4 py-2"
                  >
                    Complete Results
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <CalendarIcon className="w-6 h-6 mr-3 text-ufc-gold" />
            Recent Events
          </h2>
          <Link to="/admin/events" className="text-ufc-red hover:text-red-400 flex items-center">
            View All
            <CalendarIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-4">
          {events.slice(0, 5).map((event) => {
            const completedFights = event.fights.filter(fight => fight.isCompleted).length;
            const totalFights = event.fights.length;
            
            return (
              <div key={event.id} className="flex justify-between items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{event.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'upcoming' ? 'bg-green-600 text-white' :
                      event.status === 'completed' ? 'bg-blue-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {event.status}
                    </span>
                    {totalFights > 0 && (
                      <span className="text-xs text-gray-400">
                        {completedFights}/{totalFights} results
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {new Date(event.date).toLocaleDateString()} • {event.venue.name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="text-ufc-red hover:text-red-400 text-sm px-3 py-1 rounded border border-ufc-red hover:bg-ufc-red hover:text-white transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/results`}
                    className="text-yellow-400 hover:text-yellow-300 text-sm px-3 py-1 rounded border border-yellow-400 hover:bg-yellow-400 hover:text-white transition-colors"
                  >
                    Results
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No events yet</h3>
            <p className="text-gray-400 mb-4">Create your first UFC event to get started</p>
            <Link to="/admin/events/create" className="btn-primary">
              Create Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
