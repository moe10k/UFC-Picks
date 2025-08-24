import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon, InformationCircleIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { picksAPI, eventsAPI } from '../services/api';
import { UserPick } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MyPicks: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [picks, setPicks] = useState<UserPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [otherUsersPicks, setOtherUsersPicks] = useState<Record<number, { picks: UserPick[]; currentPage: number; totalPages: number; totalPlayers: number; isLoading: boolean }>>({});
  const [showScoringInfo, setShowScoringInfo] = useState(false);
  const [eventResults, setEventResults] = useState<Record<number, any>>({});

  const fetchEventResults = useCallback(async (eventId: number) => {
    try {
      console.log('Fetching event results for event ID:', eventId);
      const { event } = await eventsAPI.getById(eventId);
      console.log('Event data received:', event);
      
      if (event && event.fights) {
        console.log('Setting event results for event ID:', eventId, event.fights);
        setEventResults(prev => ({
          ...prev,
          [eventId]: event.fights
        }));
      } else {
        console.log('No event or fights data found in response');
      }
    } catch (error) {
      console.error('Error fetching event results:', error);
    }
  }, []);

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        setIsLoading(true);
        const { picks: userPicks } = await picksAPI.getMyPicks();
        setPicks(userPicks);
        
        // Fetch results for completed events
        userPicks.forEach(pick => {
          const event = typeof pick.event === 'string' ? null : pick.event;
          if (event?.status === 'completed') {
            fetchEventResults(event.id);
          }
        });
      } catch (error: any) {
        console.error('Error fetching picks:', error);
        toast.error('Failed to load your picks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPicks();
  }, [fetchEventResults]);

  const toggleEventExpanded = (eventId: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
      // Fetch other users' picks when expanding
      if (!otherUsersPicks[eventId]) {
        setOtherUsersPicks(prev => ({
          ...prev,
          [eventId]: {
            picks: [],
            currentPage: 1,
            totalPages: 0,
            totalPlayers: 0,
            isLoading: false
          }
        }));
        fetchOtherUsersPicks(eventId, 1);
      }
    }
    setExpandedEvents(newExpanded);
  };

  const fetchOtherUsersPicks = async (eventId: number, page: number) => {
    try {
      // Initialize loading state for this event
      setOtherUsersPicks(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          isLoading: true,
          totalPlayers: prev[eventId]?.totalPlayers || 0
        }
      }));

      const { picks: eventPicks } = await picksAPI.getEventPicks(eventId);
      
      console.log('Fetched event picks:', eventPicks); // Debug log
      
      // Filter out current user and sort remaining users alphabetically by username
      const filteredPicks = eventPicks.filter(pick => {
        const username = typeof pick.user === 'string' ? pick.user : pick.user.username;
        return username !== currentUser?.username;
      });
      
      console.log('Filtered picks (excluding current user):', filteredPicks); // Debug log
      
      const sortedPicks = filteredPicks.sort((a, b) => {
        const usernameA = typeof a.user === 'string' ? a.user : a.user.username;
        const usernameB = typeof b.user === 'string' ? b.user : b.user.username;
        return usernameA.localeCompare(usernameB);
      });

      // Paginate the results (10 per page)
      const itemsPerPage = 10;
      const totalPages = Math.ceil(sortedPicks.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPicks = sortedPicks.slice(startIndex, endIndex);

      setOtherUsersPicks(prev => ({
        ...prev,
        [eventId]: {
          picks: paginatedPicks,
          currentPage: page,
          totalPages,
          totalPlayers: sortedPicks.length,
          isLoading: false
        }
      }));
    } catch (error: any) {
      console.error('Error fetching other users picks:', error);
      if (error.response?.status === 403) {
        toast.error('You must participate in this event to view other players picks');
      } else {
        toast.error('Failed to load other users picks');
      }
      setOtherUsersPicks(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          isLoading: false,
          totalPlayers: prev[eventId]?.totalPlayers || 0
        }
      }));
    }
  };

  const changePage = (eventId: number, newPage: number) => {
    // Update the current page immediately for better UX
    setOtherUsersPicks(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        currentPage: newPage
      }
    }));
    fetchOtherUsersPicks(eventId, newPage);
  };

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
      {/* Scoring Information */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-ufc-gold/10 to-ufc-red/10 rounded-2xl"></div>
        <div className="relative bg-gradient-to-r from-ufc-gray/90 to-gray-800/90 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl">
          <button
            onClick={() => setShowScoringInfo(!showScoringInfo)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <InformationCircleIcon className="h-6 w-6 text-ufc-gold" />
              <h2 className="text-xl font-bold text-white">How Scoring Works</h2>
            </div>
            {showScoringInfo ? (
              <ChevronUpIcon className="h-6 w-6 text-ufc-gold transition-transform duration-200" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-ufc-gold transition-transform duration-200" />
            )}
          </button>
          
          {showScoringInfo && (
            <div className="px-6 pb-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Decision Scoring */}
                <div className="bg-gradient-to-br from-ufc-dark/50 to-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold text-white">Decision</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Correct winner prediction
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Winner:</span>
                      <span className="text-white font-medium">+3 points</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Method:</span>
                      <span className="text-white font-medium">+1 point</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Round:</span>
                      <span className="text-gray-500">N/A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-gray-500">N/A</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-600/30">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-blue-400">+4 points</span>
                    </div>
                  </div>
                </div>

                {/* KO/TKO Scoring */}
                <div className="bg-gradient-to-br from-ufc-dark/50 to-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h3 className="font-semibold text-white">KO/TKO</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Correct winner + method + round + time
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Winner:</span>
                      <span className="text-white font-medium">+3 points</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Method:</span>
                      <span className="text-white font-medium">+1 point</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Round:</span>
                      <span className="text-white font-medium">+1 point</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white font-medium">+1 point</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-600/30">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-red-400">+6 points</span>
                    </div>
                  </div>
                </div>

                {/* Submission Scoring */}
                <div className="bg-gradient-to-br from-ufc-dark/50 to-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h3 className="font-semibold text-white">Submission</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Correct winner + method + round + time
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Winner:</span>
                      <span className="text-white font-medium">+3 points</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Method:</span>
                      <span className="text-white font-medium">+1 point</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Round:</span>
                      <span className="text-white font-medium">+1 point</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white font-medium">+1 point</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-600/30">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-purple-400">+6 points</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-ufc-red/10 to-ufc-gold/10 rounded-xl border border-ufc-red/20">
                <div className="flex items-start gap-3">
                  <TrophyIcon className="h-5 w-5 text-ufc-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-2">Pro Tips</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>Decision fights</strong> are easier to predict but offer fewer points</li>
                      <li>• <strong>KO/TKO and Submission</strong> fights offer maximum points but require more precise predictions</li>
                      <li>• <strong>Round accuracy</strong> is crucial for finish predictions - be strategic!</li>
                      <li>• <strong>Time precision</strong> can be the difference between winning and losing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-white">
                        {event ? event.name : 'Event'}
                      </h3>
                      {event && (
                        <>
                          <span className="text-gray-400">|</span>
                          <div className="flex items-center gap-2 text-gray-400">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                          </div>
                          <span className="text-gray-400">|</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-800 ${getStatusColor(status)}`}>
                            {status}
                          </span>
                                                     <span className="text-gray-400">|</span>
                           {event.status === 'completed' && (
                             <Link 
                               to={`/leaderboard/event/${event.id}`}
                               className="btn-outline text-sm py-1 px-3"
                             >
                               View Results
                             </Link>
                           )}
                        </>
                      )}
                    </div>
                    

                  </div>
                  
                  
                </div>

                {/* Pick Details */}
                {pick.pickDetails && pick.pickDetails.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center gap-4 mb-4">
                      <h4 className="text-lg font-bold text-white">Your Predictions</h4>
                      <span className="text-gray-400">|</span>
                      <span className="text-ufc-red font-semibold">{pick.totalPoints} Points</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-green-400 font-semibold">{pick.correctPicks}/{pick.pickDetails.length} Correct</span>
                      <span className="text-gray-400">|</span>
                      <span className={`font-semibold ${getAccuracyColor(pick.accuracy !== undefined && pick.accuracy !== null ? `${pick.accuracy.toFixed(1)}%` : '0%')}`}>{pick.accuracy !== undefined && pick.accuracy !== null ? `${pick.accuracy.toFixed(1)}%` : '0%'}</span>
                    </div>
                    
                    
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                             {pick.pickDetails.map((pickDetail, index) => {
                         const fight = pickDetail.fight;
                         

                         
                         return (
                          <div key={index} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-300">
                                Fight {fight?.fightNumber}
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
                                    {pickDetail.predictedWinner === 'fighter1' ? fight.fighter1Name : fight.fighter2Name}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Method:</span>
                                  <span className="text-white font-medium">{pickDetail.predictedMethod}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Round:</span>
                                  <span className="text-white font-medium">
                                    {pickDetail.predictedMethod === 'Decision' ? 'N/A' : pickDetail.predictedRound}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Time:</span>
                                  <span className="text-white font-medium">
                                    {pickDetail.predictedMethod === 'Decision' ? 'N/A' : (pickDetail.predictedTime || 'N/A')}
                                  </span>
                                </div>
                                
                                {/* Points Display */}
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Points:</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${pickDetail.pointsEarned > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                      {pickDetail.pointsEarned > 0 ? `+${pickDetail.pointsEarned}` : '0'}
                                    </span>
                                    {fight.isCompleted && (
                                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                                        pickDetail.isCorrect 
                                          ? 'bg-green-900 text-green-300' 
                                          : 'bg-red-900 text-red-300'
                                      }`}>
                                        {pickDetail.isCorrect ? (
                                          <CheckCircleIcon className="w-3 h-3" />
                                        ) : (
                                          <XCircleIcon className="w-3 h-3" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                                                 {event?.status === 'completed' && pickDetail.pointsEarned !== undefined && (
                                   <div className="mt-3 pt-3 border-t border-gray-700">
                                     <div className="flex items-center gap-2">
                                       {(() => {
                                         const eventFights = eventResults[event.id];
                                         const actualFight = eventFights?.find((f: any) => f.fightNumber === fight.fightNumber);
                                         const actualWinner = actualFight?.winner;
                                         const actualMethod = actualFight?.method;
                                         const actualRound = actualFight?.round;
                                         const actualTime = actualFight?.time;
                                         const isCorrect = actualWinner === pickDetail.predictedWinner;
                                         
                                         return (
                                           <>
                                             {isCorrect ? (
                                               <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                             ) : (
                                               <XCircleIcon className="h-4 w-4 text-red-400" />
                                             )}
                                             <span className="text-xs text-gray-400">
                                               Actual: {actualWinner === 'fighter1' ? fight.fighter1Name : fight.fighter2Name} - {actualMethod || 'Unknown'}
                                               {actualMethod && actualMethod !== 'Decision' && actualRound && ` (R${actualRound}${actualTime ? ` at ${actualTime}` : ''})`}
                                             </span>
                                           </>
                                         );
                                       })()}
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

                {/* Other Users Picks Section */}
                {event && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                                         <button
                       onClick={() => toggleEventExpanded(event.id)}
                       className="flex items-center gap-2 text-left mb-4 group"
                     >
                       <h4 className="text-lg font-bold text-white group-hover:text-ufc-red transition-colors">
                         Other Players' Picks
                       </h4>
                       {expandedEvents.has(event.id) ? (
                         <ChevronUpIcon className="h-5 w-5 text-gray-400 group-hover:text-ufc-red transition-colors" />
                       ) : (
                         <ChevronDownIcon className="h-5 w-5 text-gray-400 group-hover:text-ufc-red transition-colors" />
                       )}
                     </button>

                    {expandedEvents.has(event.id) && (
                      <div className="space-y-4">
                        {otherUsersPicks[event.id]?.isLoading ? (
                          <div className="text-center py-8">
                            <LoadingSpinner />
                          </div>
                        ) : otherUsersPicks[event.id]?.picks && otherUsersPicks[event.id].picks.length > 0 ? (
                          <>
                                                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                               {otherUsersPicks[event.id].picks.map((userPick, index) => {
                                 const username = typeof userPick.user === 'string' ? userPick.user : userPick.user.username;
                                 const isCurrentUser = typeof userPick.user === 'string' ? false : userPick.user.username === currentUser?.username;
                                 
                                 return (
                                   <div key={userPick.id} className={`bg-gray-800 rounded-lg p-4 ${isCurrentUser ? 'ring-2 ring-ufc-red' : ''}`}>
                                     <div className="flex items-center justify-between mb-3">
                                       <span className="text-sm font-medium text-white">
                                         {username}
                                         {isCurrentUser && <span className="ml-2 text-xs text-ufc-red">(You)</span>}
                                       </span>
                                       <div className="text-right">
                                         <div className="text-sm font-medium text-ufc-red">
                                           {userPick.totalPoints} pts
                                         </div>
                                         <div className="text-xs text-gray-400">
                                           {userPick.correctPicks}/{userPick.totalPicks} correct
                                         </div>
                                       </div>
                                     </div>
                                     
                                     <div className="space-y-2">
                                       {userPick.pickDetails?.map((pickDetail, fightIndex) => {
                                         const fight = pickDetail.fight;
                                         return (
                                           <div key={fightIndex} className="text-xs">
                                             <div className="flex justify-between">
                                               <span className="text-gray-400">Fight {fight?.fightNumber}:</span>
                                               <span className="text-white">
                                                 {pickDetail.predictedWinner === 'fighter1' ? fight?.fighter1Name : fight?.fighter2Name}
                                               </span>
                                             </div>
                                             <div className="flex justify-between">
                                               <span className="text-gray-400">Method:</span>
                                               <span className="text-white">{pickDetail.predictedMethod}</span>
                                             </div>
                                             {pickDetail.predictedMethod !== 'Decision' && (
                                               <div className="flex justify-between">
                                                 <span className="text-gray-400">Round:</span>
                                                 <span className="text-white">{pickDetail.predictedRound}</span>
                                               </div>
                                             )}
                                             {pickDetail.predictedMethod !== 'Decision' && (
                                               <div className="flex justify-between">
                                                 <span className="text-gray-400">Time:</span>
                                                 <span className="text-white">{pickDetail.predictedTime || 'N/A'}</span>
                                               </div>
                                             )}
                                           </div>
                                         );
                                       }) || []}
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>

                            {/* Pagination */}
                            {otherUsersPicks[event.id].totalPages > 1 && (
                              <div className="flex items-center justify-center gap-2 mt-6">
                                <button
                                  onClick={() => changePage(event.id, otherUsersPicks[event.id].currentPage - 1)}
                                  disabled={otherUsersPicks[event.id].currentPage === 1}
                                  className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-800 rounded-md hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Previous
                                </button>
                                
                                <span className="px-3 py-2 text-sm text-gray-400">
                                  Page {otherUsersPicks[event.id].currentPage} of {otherUsersPicks[event.id].totalPages}
                                </span>
                                
                                <button
                                  onClick={() => changePage(event.id, otherUsersPicks[event.id].currentPage + 1)}
                                  disabled={otherUsersPicks[event.id].currentPage === otherUsersPicks[event.id].totalPages}
                                  className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-800 rounded-md hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            {otherUsersPicks[event.id]?.totalPlayers === 0 
                              ? "No other players have made picks for this event yet."
                              : "Loading other players' picks..."
                            }
                          </div>
                        )}
                      </div>
                    )}
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