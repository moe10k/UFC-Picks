import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingEvent = async () => {
      try {
        const { event } = await eventsAPI.getUpcoming();
        setUpcomingEvent(event);
      } catch (error: any) {
        if (error.response?.status !== 404) {
          toast.error('Failed to load upcoming event');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingEvent();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!upcomingEvent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">No Upcoming Events</h2>
        <p className="text-gray-400">Check back later for the next UFC event!</p>
      </div>
    );
  }

  const mainCardFights = upcomingEvent.fights.filter(fight => fight.isMainCard);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user?.firstName}! 👊
        </h1>
        <p className="text-gray-400 text-lg">
          Ready to make your picks for the next UFC event?
        </p>
      </div>

      {/* Upcoming Event Card */}
      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">{upcomingEvent.name}</h2>
          <p className="text-gray-400">
            {upcomingEvent.venue.name} • {upcomingEvent.venue.city}, {upcomingEvent.venue.country}
          </p>
          <p className="text-ufc-red font-semibold mt-2">
            {new Date(upcomingEvent.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Main Card Fights */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Main Card Fights</h3>
          {mainCardFights.map((fight) => (
            <div key={fight.fightNumber} className="fight-card">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-ufc-red font-semibold">
                  Fight #{fight.fightNumber}
                </span>
                <span className="text-sm text-gray-400">{fight.weightClass}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fighter 1 */}
                <div className="fighter-card text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                    {fight.fighter1.image ? (
                      <img 
                        src={fight.fighter1.image} 
                        alt={fight.fighter1.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {fight.fighter1.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-white">{fight.fighter1.name}</h4>
                  {fight.fighter1.nickname && (
                    <p className="text-sm text-gray-400">"{fight.fighter1.nickname}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {fight.fighter1.record.wins}-{fight.fighter1.record.losses}
                    {fight.fighter1.record.draws > 0 && `-${fight.fighter1.record.draws}`}
                  </p>
                </div>

                {/* VS */}
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-bold text-ufc-red">VS</span>
                </div>

                {/* Fighter 2 */}
                <div className="fighter-card text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                    {fight.fighter2.image ? (
                      <img 
                        src={fight.fighter2.image} 
                        alt={fight.fighter2.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {fight.fighter2.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-white">{fight.fighter2.name}</h4>
                  {fight.fighter2.nickname && (
                    <p className="text-sm text-gray-400">"{fight.fighter2.nickname}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {fight.fighter2.record.wins}-{fight.fighter2.record.losses}
                    {fight.fighter2.record.draws > 0 && `-${fight.fighter2.record.draws}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-8">
          <Link
            to={`/event/${upcomingEvent.id}/picks`}
            className="btn-primary text-lg px-8 py-3 inline-block"
          >
            Make Your Picks
          </Link>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Total Points</h3>
          <p className="text-3xl font-bold text-ufc-gold">{user?.stats.totalPoints || 0}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Accuracy</h3>
          <p className="text-3xl font-bold text-ufc-gold">
            {user?.stats.totalPicks ? 
              `${((user.stats.correctPicks / user.stats.totalPicks) * 100).toFixed(1)}%` : 
              '0%'
            }
          </p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Events Participated</h3>
          <p className="text-3xl font-bold text-ufc-gold">{user?.stats.eventsParticipated || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 