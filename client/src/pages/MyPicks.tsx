import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { picksAPI } from '../services/api';
import { UserPick } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MyPicks: React.FC = () => {
  const [picks, setPicks] = useState<UserPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        setIsLoading(true);
        const { picks: userPicks } = await picksAPI.getMyPicks();
        setPicks(userPicks);
      } catch (error: any) {
        console.error('Error fetching picks:', error);
        toast.error('Failed to load your picks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPicks();
  }, []);

  const getEventStatus = (event: any) => {
    if (event.status === 'completed') return 'Completed';
    if (event.status === 'live') return 'Live';
    if (event.pickDeadline && new Date() > new Date(event.pickDeadline)) return 'Deadline Passed';
    return 'Upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-400';
      case 'Live':
        return 'text-red-400';
      case 'Deadline Passed':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const getAccuracyColor = (accuracy: string) => {
    const percentage = parseFloat(accuracy);
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
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
              My Picks
            </h1>
            <p className="text-gray-400">
              Track your predictions and see how you performed
            </p>
          </div>
          
          <div className="lg:flex-shrink-0">
            <Link to="/dashboard" className="btn-primary">
              View Upcoming Events
            </Link>
          </div>
        </div>
      </div>

      {/* Picks List */}
      {picks.length > 0 ? (
        <div className="space-y-6">
          {picks.map((pick) => {
            const event = typeof pick.event === 'string' ? null : pick.event;
            const status = event ? getEventStatus(event) : 'Unknown';
            
            return (
              <div key={pick.id} className="card">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-white">
                        {event ? event.name : 'Event'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-800 ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    
                    {event && (
                      <div className="flex items-center gap-2 text-gray-400 mb-4">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-ufc-red">
                          {pick.totalPoints}
                        </div>
                        <div className="text-gray-400 text-sm">Points</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {pick.correctPicks}/{pick.picks.length}
                        </div>
                        <div className="text-gray-400 text-sm">Correct</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getAccuracyColor(pick.accuracy || '0%')}`}>
                          {pick.accuracy || '0%'}
                        </div>
                        <div className="text-gray-400 text-sm">Accuracy</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {pick.picks.length}
                        </div>
                        <div className="text-gray-400 text-sm">Total Picks</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:flex-shrink-0 flex gap-3">
                    {event && (
                      <Link 
                        to={`/event/${event.id}`}
                        className="btn-outline"
                      >
                        View Event
                      </Link>
                    )}
                    
                    {event && event.status === 'completed' && (
                      <Link 
                        to={`/leaderboard/event/${event.id}`}
                        className="btn-secondary"
                      >
                        View Results
                      </Link>
                    )}
                  </div>
                </div>

                {/* Pick Details */}
                {pick.picks.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4">Your Predictions</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pick.picks.map((fightPick, index) => {
                        const fight = event?.fights.find(f => f.fightNumber === fightPick.fightNumber);
                        
                        return (
                          <div key={index} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-300">
                                Fight {fightPick.fightNumber}
                              </span>
                              {fight?.isMainEvent && (
                                <span className="px-2 py-1 bg-ufc-red rounded text-xs font-medium text-white">
                                  Main Event
                                </span>
                              )}
                            </div>
                            
                            {fight && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Winner:</span>
                                  <span className="text-white font-medium">
                                    {fightPick.winner === 'fighter1' ? fight.fighter1.name : fight.fighter2.name}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Method:</span>
                                  <span className="text-white font-medium">{fightPick.method}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Round:</span>
                                  <span className="text-white font-medium">{fightPick.round}</span>
                                </div>
                                
                                {fight.result && (
                                  <div className="mt-3 pt-3 border-t border-gray-700">
                                    <div className="flex items-center gap-2">
                                      {fight.result.winner === fightPick.winner ? (
                                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                      ) : (
                                        <XCircleIcon className="h-4 w-4 text-red-400" />
                                      )}
                                      <span className="text-xs text-gray-400">
                                        Actual: {fight.result.winner === 'fighter1' ? fight.fighter1.name : fight.fighter2.name} - {fight.result.method} (R{fight.result.round})
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="card text-center">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="h-12 w-12 text-gray-400" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4">No Picks Yet</h3>
          <p className="text-gray-400 mb-6">
            You haven't made any picks yet. Start predicting fight outcomes to see your performance here!
          </p>
          
          <Link to="/dashboard" className="btn-primary">
            Make Your First Picks
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyPicks; 