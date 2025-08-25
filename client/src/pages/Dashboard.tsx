import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, leaderboardAPI, picksAPI } from '../services/api';
import { EventWithFights, UserStats } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatFighterRecord } from '../utils/formatRecord';
import { getActualEventStatus, getEventStatusText, getEventStatusColor } from '../utils/eventStatus';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingEvent, setUpcomingEvent] = useState<EventWithFights | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingPicks, setHasExistingPicks] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch upcoming event and user ranking in parallel
        const [eventResponse, userRankingResponse] = await Promise.all([
          eventsAPI.getUpcoming().catch(() => ({ event: null })), // Handle 404 gracefully
          leaderboardAPI.getUserRanking(user?.id || 0).catch(() => ({ stats: null, rankings: null })) // Handle errors gracefully
        ]);
        
        setUpcomingEvent(eventResponse.event as EventWithFights);
        setUserStats(userRankingResponse.stats);
        setUserRank(userRankingResponse.rankings?.global || null);

        // Check if user already has picks for this event
        if (eventResponse.event?.id) {
          try {
            const { picks: userPicks } = await picksAPI.getMyPicks(eventResponse.event.id.toString());
            const existingUserPick = userPicks.find((pick: any) => pick.event.id === eventResponse.event.id);
            setHasExistingPicks(!!existingUserPick);
          } catch (error) {
            // If no picks found, set to false
            setHasExistingPicks(false);
          }
        }
      } catch (error: any) {
        console.error('Dashboard fetch error:', error);
        // Don't show toast for expected 404s, but log other errors
        if (error.response?.status !== 404) {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!upcomingEvent?.pickDeadline) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadline = new Date(upcomingEvent.pickDeadline).getTime();
      const difference = deadline - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [upcomingEvent?.pickDeadline]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const mainCardFights = upcomingEvent ? upcomingEvent.fights ? upcomingEvent.fights.filter(fight => fight.isMainCard) : [] : [];
  const eventStatus = upcomingEvent ? getActualEventStatus(upcomingEvent) : null;
  const isEventLive = eventStatus === 'live';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Event Info (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {upcomingEvent ? (
          <>
            {/* Event Card */}
            <div className="card">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">{upcomingEvent.name}</h2>
                {/* Event Status Badge */}
                {eventStatus && (
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEventStatusColor(eventStatus)}`}>
                      {getEventStatusText(eventStatus)}
                    </span>
                  </div>
                )}
                <p className="text-gray-400">
                  {upcomingEvent.venue.name} • {upcomingEvent.venue.city}, {upcomingEvent.venue.country} • {new Date(upcomingEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* CTA Button */}
              <div className="text-center mb-8">
                {isEventLive ? (
                  <Link
                    to={`/event/${upcomingEvent.id}`}
                    className="relative inline-flex items-center justify-center p-4 px-8 py-4 overflow-hidden font-bold text-white text-xl rounded-lg shadow-2xl group transition-all duration-300 hover:scale-105 min-w-[200px] bg-gray-600"
                  >
                    <span className="relative text-white font-bold text-xl">
                      View Event Details
                    </span>
                  </Link>
                ) : (
                  <Link
                    to={`/event/${upcomingEvent.id}/picks`}
                    className="relative inline-flex items-center justify-center p-4 px-8 py-4 overflow-hidden font-bold text-white text-xl rounded-lg shadow-2xl group transition-all duration-300 hover:scale-105 min-w-[200px]"
                  >
                    <span className="absolute top-0 left-0 w-40 h-40 -mt-10 -ml-3 transition-all duration-700 bg-ufc-gold rounded-full blur-md ease opacity-80"></span>
                    <span className="absolute inset-0 w-full h-full transition duration-700 group-hover:rotate-180 ease">
                      <span className="absolute bottom-0 left-0 w-24 h-24 -ml-10 bg-yellow-400 rounded-full blur-md"></span>
                      <span className="absolute bottom-0 right-0 w-24 h-24 -mr-10 bg-orange-400 rounded-full blur-md"></span>
                    </span>
                    <span className="relative text-white font-bold text-xl">
                      {hasExistingPicks ? 'Modify Picks' : 'Make Your Picks'}
                    </span>
                  </Link>
                )}
              </div>

              {/* Main Card Fights */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">Main Card Fights</h3>
                {mainCardFights && mainCardFights.length > 0 ? mainCardFights.map((fight) => (
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
                          {fight.fighter1Image ? (
                            <img 
                              src={fight.fighter1Image} 
                              alt={fight.fighter1Name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {fight.fighter1Name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-white">{fight.fighter1Name}</h4>
                        {fight.fighter1Nick && (
                          <p className="text-sm text-gray-400">"{fight.fighter1Nick}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFighterRecord(fight.fighter1Record)}
                        </p>
                      </div>

                      {/* VS */}
                      <div className="flex items-center justify-center">
                        <span className="text-2xl font-bold text-ufc-red">VS</span>
                      </div>

                      {/* Fighter 2 */}
                      <div className="fighter-card text-center">
                        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                          {fight.fighter2Image ? (
                            <img 
                              src={fight.fighter2Image} 
                              alt={fight.fighter2Name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {fight.fighter2Name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-white">{fight.fighter2Name}</h4>
                        {fight.fighter2Nick && (
                          <p className="text-sm text-gray-400">"{fight.fighter2Nick}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFighterRecord(fight.fighter2Record)}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No main card fights available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* No Upcoming Events Message */
          <div className="card text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">No Upcoming Events</h2>
            <p className="text-gray-400">Check back later for the next UFC event!</p>
          </div>
        )}
      </div>

      {/* Right Column - User Info & Stats (1/3 width) */}
      <div className="space-y-6">
        {/* User Greeting */}
        <div className="card text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, @{user?.username}! 👊
          </h1>
          <p className="text-gray-400">
            {upcomingEvent ? (
              isEventLive ? 'The UFC event is live now! Watch the action!' : 'Ready to make your picks for the next UFC event?'
            ) : 'Stay tuned for the next UFC event!'}
          </p>
        </div>

        {/* Countdown Section */}
        {upcomingEvent ? (
          <div className="card text-center">
            {isEventLive ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">🔥 Event is Live!</h3>
                <div className="text-center py-4">
                  <p className="text-lg text-ufc-red font-semibold mb-2">Fights are happening now!</p>
                  <p className="text-gray-400 text-sm">Picks are locked in. Watch the action!</p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">⏰ Picks Lock In</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="countdown-item">
                    <div className="text-2xl font-bold text-ufc-red">{timeRemaining.days}</div>
                    <div className="text-sm text-gray-400">Days</div>
                  </div>
                  <div className="countdown-item">
                    <div className="text-2xl font-bold text-ufc-red">{timeRemaining.hours.toString().padStart(2, '0')}</div>
                    <div className="text-sm text-gray-400">Hours</div>
                  </div>
                  <div className="countdown-item">
                    <div className="text-2xl font-bold text-ufc-red">{timeRemaining.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-sm text-gray-400">Minutes</div>
                  </div>
                  <div className="countdown-item">
                    <div className="text-2xl font-bold text-ufc-red">{timeRemaining.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-sm text-gray-400">Seconds</div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Placeholder when no upcoming event */
          <div className="card text-center py-8">
            <h3 className="text-xl font-semibold text-white mb-4">⏰ Next Event</h3>
            <p className="text-gray-400">Waiting for the next UFC event to be announced...</p>
          </div>
        )}

        {/* User Stats */}
        <div className="card">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">Your Stats</h3>
          {userStats ? (
            <div className="space-y-4">
              <div className="stat-item">
                <div className="text-3xl font-bold text-ufc-red">{userStats.totalPoints}</div>
                <div className="text-sm text-gray-400">Total Points</div>
              </div>
              
              <div className="stat-item">
                <div className="text-2xl font-bold text-white">#{userRank || 'N/A'}</div>
                <div className="text-sm text-gray-400">Current Rank</div>
              </div>
              
              <div className="stat-item">
                <div className="text-2xl font-bold text-white">
                  {userStats.correctPicks}/{userStats.totalPicks}
                </div>
                <div className="text-sm text-gray-400">Correct Picks</div>
              </div>
              
              <div className="stat-item">
                <div className="text-lg font-semibold text-white">
                  {userStats.averageAccuracy ? `${userStats.averageAccuracy.toFixed(1)}%` : '0%'}
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
              
              <div className="stat-item">
                <div className="text-lg font-semibold text-white">{userStats.eventsParticipated}</div>
                <div className="text-sm text-gray-400">Events Participated</div>
              </div>
              
              <div className="stat-item">
                <div className="text-lg font-semibold text-white">{userStats.currentStreak}</div>
                <div className="text-sm text-gray-400">Current Streak</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              <p>No stats available yet</p>
              <p className="text-sm mt-2">Participate in events to see your stats!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 