import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { eventsAPI } from '../services/api';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const { event: eventData } = await eventsAPI.getById(id);
        setEvent(eventData);
      } catch (error: any) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Event Not Found</h2>
        <p className="text-gray-400 mb-6">The event you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const mainCardFights = event.fights.filter(fight => fight.isMainCard);
  const prelimFights = event.fights.filter(fight => !fight.isMainCard);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-400';
      case 'live':
        return 'text-red-400';
      case 'completed':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'live':
        return 'Live';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Event Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-800 ${getStatusColor(event.status)}`}>
                {getStatusText(event.status)}
              </span>
              {event.isActive && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-400">
                  Active
                </span>
              )}
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {event.name}
            </h1>
            
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                <span>{event.venue.name}, {event.venue.city}{event.venue.state && `, ${event.venue.state}`}, {event.venue.country}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <span>Pick Deadline: {format(new Date(event.pickDeadline), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
            
            {event.description && (
              <p className="mt-4 text-gray-400 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
          
          {event.image && (
            <div className="lg:flex-shrink-0">
              <img 
                src={event.image} 
                alt={event.name}
                className="w-full lg:w-64 h-48 lg:h-40 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to={`/event/${id}/picks`}
          className="btn-primary flex-1 text-center"
        >
          Make Picks
        </Link>
        <Link 
          to={`/leaderboard/event/${id}`}
          className="btn-outline flex-1 text-center"
        >
          View Leaderboard
        </Link>
      </div>

      {/* Main Card */}
      {mainCardFights.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-ufc-red rounded"></span>
            Main Card
          </h2>
          
          <div className="space-y-4">
            {mainCardFights.map((fight) => (
              <div key={fight.fightNumber} className="fight-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">Fight {fight.fightNumber}</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs font-medium text-gray-300">
                      {fight.weightClass}
                    </span>
                    {fight.isMainEvent && (
                      <span className="px-2 py-1 bg-ufc-red rounded text-xs font-medium text-white">
                        Main Event
                      </span>
                    )}
                    {fight.isCoMainEvent && (
                      <span className="px-2 py-1 bg-ufc-gold rounded text-xs font-medium text-black">
                        Co-Main
                      </span>
                    )}
                  </div>
                  
                  {fight.isCompleted && (
                    <span className="text-sm text-green-400 font-medium">
                      Completed
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Fighter 1 */}
                  <div className="fighter-card text-center">
                    <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                      {fight.fighter1.image ? (
                        <img 
                          src={fight.fighter1.image} 
                          alt={fight.fighter1.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">?</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">
                      {fight.fighter1.name}
                    </h3>
                    {fight.fighter1.nickname && (
                      <p className="text-ufc-red text-sm mb-2">"{fight.fighter1.nickname}"</p>
                    )}
                    <p className="text-gray-400 text-sm">
                      {fight.fighter1.record.wins}-{fight.fighter1.record.losses}-{fight.fighter1.record.draws}
                    </p>
                  </div>
                  
                  {/* VS */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ufc-red mb-2">VS</div>
                      {fight.result && (
                        <div className="text-sm text-gray-400">
                          <div className="font-medium">
                            Winner: {fight.result.winner === 'fighter1' ? fight.fighter1.name : fight.fighter2.name}
                          </div>
                          <div>{fight.result.method} - Round {fight.result.round}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Fighter 2 */}
                  <div className="fighter-card text-center">
                    <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                      {fight.fighter2.image ? (
                        <img 
                          src={fight.fighter2.image} 
                          alt={fight.fighter2.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">?</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">
                      {fight.fighter2.name}
                    </h3>
                    {fight.fighter2.nickname && (
                      <p className="text-ufc-red text-sm mb-2">"{fight.fighter2.nickname}"</p>
                    )}
                    <p className="text-gray-400 text-sm">
                      {fight.fighter2.record.wins}-{fight.fighter2.record.losses}-{fight.fighter2.record.draws}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preliminary Card */}
      {prelimFights.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-gray-600 rounded"></span>
            Preliminary Card
          </h2>
          
          <div className="space-y-4">
            {prelimFights.map((fight) => (
              <div key={fight.fightNumber} className="fight-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">Fight {fight.fightNumber}</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs font-medium text-gray-300">
                      {fight.weightClass}
                    </span>
                  </div>
                  
                  {fight.isCompleted && (
                    <span className="text-sm text-green-400 font-medium">
                      Completed
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Fighter 1 */}
                  <div className="fighter-card text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                      {fight.fighter1.image ? (
                        <img 
                          src={fight.fighter1.image} 
                          alt={fight.fighter1.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-400">?</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white mb-1">
                      {fight.fighter1.name}
                    </h3>
                    {fight.fighter1.nickname && (
                      <p className="text-ufc-red text-xs mb-1">"{fight.fighter1.nickname}"</p>
                    )}
                    <p className="text-gray-400 text-xs">
                      {fight.fighter1.record.wins}-{fight.fighter1.record.losses}-{fight.fighter1.record.draws}
                    </p>
                  </div>
                  
                  {/* VS */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-400 mb-2">VS</div>
                      {fight.result && (
                        <div className="text-xs text-gray-400">
                          <div className="font-medium">
                            {fight.result.winner === 'fighter1' ? fight.fighter1.name : fight.fighter2.name}
                          </div>
                          <div>{fight.result.method} - R{fight.result.round}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Fighter 2 */}
                  <div className="fighter-card text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                      {fight.fighter2.image ? (
                        <img 
                          src={fight.fighter2.image} 
                          alt={fight.fighter2.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-400">?</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white mb-1">
                      {fight.fighter2.name}
                    </h3>
                    {fight.fighter2.nickname && (
                      <p className="text-ufc-red text-xs mb-1">"{fight.fighter2.nickname}"</p>
                    )}
                    <p className="text-gray-400 text-xs">
                      {fight.fighter2.record.wins}-{fight.fighter2.record.losses}-{fight.fighter2.record.draws}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails; 