import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import { leaderboardAPI, eventsAPI } from '../services/api';
import { LeaderboardEntry, Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Leaderboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (eventId) {
          // Fetch event-specific leaderboard
          const response = await leaderboardAPI.getEvent(eventId, { page: currentPage });
          setLeaderboard(response.leaderboard as any);
          setEvent(response.event as any);
          setHasNext(response.pagination.hasNext);
          setHasPrev(response.pagination.hasPrev);
        } else {
          // Fetch global leaderboard
          const response = await leaderboardAPI.getGlobal({ page: currentPage });
          setLeaderboard(response.leaderboard);
          setHasNext(response.pagination.hasNext);
          setHasPrev(response.pagination.hasPrev);
        }
      } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, currentPage]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <StarIcon className="h-6 w-6 text-gray-400" />;
      case 3:
        return <StarIcon className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
      default:
        return 'bg-ufc-gray text-white';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {eventId ? 'Event Leaderboard' : 'Global Leaderboard'}
            </h1>
            {event && (
              <h2 className="text-xl text-gray-300">
                {event.name}
              </h2>
            )}
            <p className="text-gray-400 mt-2">
              {eventId 
                ? 'See how you rank against other players for this event'
                : 'Top performers across all events'
              }
            </p>
          </div>
          
          {eventId && (
            <div className="lg:flex-shrink-0">
              <Link to="/leaderboard" className="btn-outline">
                View Global Leaderboard
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Rank</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Player</th>
                <th className="text-center py-4 px-6 text-gray-300 font-medium">Total Points</th>
                <th className="text-center py-4 px-6 text-gray-300 font-medium">Accuracy</th>
                <th className="text-center py-4 px-6 text-gray-300 font-medium">Picks</th>
                {!eventId && (
                  <>
                    <th className="text-center py-4 px-6 text-gray-300 font-medium">Events</th>
                    <th className="text-center py-4 px-6 text-gray-300 font-medium">Best Score</th>
                    <th className="text-center py-4 px-6 text-gray-300 font-medium">Streak</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr 
                  key={entry.user.id} 
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {getRankIcon(entry.rank)}
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {entry.user.firstName.charAt(0)}{entry.user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {entry.user.firstName} {entry.user.lastName}
                        </div>
                        <div className="text-sm text-gray-400">
                          @{entry.user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRankColor(entry.rank)}`}>
                      {entry.stats.totalPoints}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-center">
                    <span className="text-white font-medium">
                      {entry.stats.accuracy}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-center">
                    <span className="text-gray-300">
                      {entry.stats.correctPicks}/{entry.stats.totalPicks}
                    </span>
                  </td>
                  
                  {!eventId && (
                    <>
                      <td className="py-4 px-6 text-center">
                        <span className="text-gray-300">
                          {entry.stats.eventsParticipated}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6 text-center">
                        <span className="text-gray-300">
                          {entry.stats.bestEventScore}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6 text-center">
                        <span className="text-gray-300">
                          {entry.stats.currentStreak}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
            <p className="text-gray-400">
              {eventId 
                ? 'No one has submitted picks for this event yet.'
                : 'No rankings available yet. Start making picks to climb the leaderboard!'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!hasPrev}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="flex items-center px-4 text-gray-300">
            Page {currentPage}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!hasNext}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Call to Action */}
      {!eventId && (
        <div className="card text-center">
          <h3 className="text-xl font-bold text-white mb-4">Want to climb the rankings?</h3>
          <p className="text-gray-400 mb-6">
            Start making picks for upcoming events to earn points and climb the leaderboard!
          </p>
          <Link to="/dashboard" className="btn-primary">
            View Upcoming Events
          </Link>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 