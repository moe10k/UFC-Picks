import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ClockIcon, CheckCircleIcon, TrophyIcon, UserIcon, InformationCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { eventsAPI, picksAPI } from '../services/api';
import { Event, Pick, Fight } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MakePicks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPick, setExistingPick] = useState<any>(null);
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  useEffect(() => {
    const fetchEventAndPicks = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch event details
        const { event: eventData } = await eventsAPI.getById(id);
        setEvent(eventData);
        
        // Check if user already has picks for this event
        try {
          const { picks: userPicks } = await picksAPI.getMyPicks(id);
          const existingUserPick = userPicks.find((pick: any) => pick.event.id === parseInt(id));
          
          if (existingUserPick) {
            setExistingPick(existingUserPick);
            setPicks(existingUserPick.picks);
          } else {
            // Initialize picks for each fight
            const initialPicks: Pick[] = eventData.fights.map((fight: Fight) => ({
              fightNumber: fight.fightNumber,
              winner: 'fighter1',
              method: 'Decision',
              round: undefined,
              time: undefined
            }));
            setPicks(initialPicks);
          }
        } catch (error) {
          // If no picks found, initialize with default picks
          const initialPicks: Pick[] = eventData.fights.map((fight: Fight) => ({
            fightNumber: fight.fightNumber,
            winner: 'fighter1',
            method: 'Decision',
            round: undefined,
            time: undefined
          }));
          setPicks(initialPicks);
        }
      } catch (error: any) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventAndPicks();
  }, [id]);

  const handlePickChange = (fightNumber: number, field: keyof Pick, value: any) => {
    setPicks(prevPicks => 
      prevPicks.map(pick => {
        if (pick.fightNumber === fightNumber) {
          const updatedPick = { ...pick, [field]: value };
          
          // If method is changed to Decision, clear the round and time
          if (field === 'method' && value === 'Decision') {
            updatedPick.round = undefined;
            updatedPick.time = undefined;
          }
          
          // If method is changed from Decision to KO/TKO or Submission, set default round to 3
          if (field === 'method' && value !== 'Decision' && pick.method === 'Decision') {
            updatedPick.round = 3;
            updatedPick.time = undefined;
          }
          
          return updatedPick;
        }
        return pick;
      })
    );
  };

  const validatePicks = () => {
    if (!picks.length) {
      toast.error('No picks to submit');
      return false;
    }

    const hasInvalidPicks = picks.some(pick => {
      // Check if winner and method are selected
      if (!pick.winner || !pick.method) {
        return true;
      }
      
      // For Decision method, round is not required
      // For other methods (KO/TKO, Submission), round is required
      if (pick.method !== 'Decision' && (pick.round === undefined || pick.round === null)) {
        return true;
      }
      
      // For KO/TKO and Submission methods, time is required
      if ((pick.method === 'KO/TKO' || pick.method === 'Submission') && !pick.time) {
        return true;
      }
      
      return false;
    });

    if (hasInvalidPicks) {
      toast.error('Please complete all picks');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!event || !id) return;
    
    if (!validatePicks()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await picksAPI.submit({
        eventId: id,
        picks: picks
      });
      
      toast.success(existingPick ? 'Picks updated successfully!' : 'Picks submitted successfully!');
      navigate('/my-picks');
    } catch (error: any) {
      const message = error.response?.data?.message || (existingPick ? 'Failed to update picks' : 'Failed to update picks');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeadlinePassed = event && new Date() > new Date(event.pickDeadline);

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

  if (isDeadlinePassed) {
    return (
      <div className="text-center py-12">
        <div className="card max-w-md mx-auto">
          <CheckCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Pick Deadline Passed</h2>
          <p className="text-gray-400 mb-6">
            The deadline for submitting picks for this event has passed.
          </p>
          <Link to={`/event/${id}`} className="btn-primary">
            View Event Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ufc-blue via-ufc-dark to-black py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-ufc-red/20 to-ufc-gold/20 rounded-3xl"></div>
          <div className="relative bg-gradient-to-r from-ufc-gray/90 to-gray-800/90 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrophyIcon className="h-8 w-8 text-ufc-gold" />
                <h1 className="text-6xl font-display font-bold bg-gradient-to-r from-white via-ufc-gold to-white bg-clip-text text-transparent tracking-tight">
                  {existingPick ? 'Modify Your Picks' : 'Make Your Picks'}
                </h1>
                <TrophyIcon className="h-8 w-8 text-ufc-gold" />
              </div>
              
              {existingPick && (
                <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-6 py-3 text-blue-300 mb-4 animate-fade-in">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    You have already submitted picks for this event. You can modify them below.
                  </span>
                </div>
              )}
              
              <div className="text-gray-300 text-lg">
                <p className="font-medium">{event.name}</p>
                <p className="text-sm text-gray-400">
                  {format(new Date(event.date), 'EEEE, MMMM do, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>

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
                        <span className="text-white font-medium">+10 points</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white font-medium">+5 points</span>
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
                        <span className="text-blue-400">+15 points</span>
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
                        <span className="text-white font-medium">+10 points</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white font-medium">+5 points</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Round:</span>
                        <span className="text-white font-medium">+3 points</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white font-medium">+2 points</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-600/30">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-gray-300">Total:</span>
                        <span className="text-red-400">+20 points</span>
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
                        <span className="text-white font-medium">+10 points</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white font-medium">+5 points</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Round:</span>
                        <span className="text-white font-medium">+3 points</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white font-medium">+2 points</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-600/30">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-gray-300">Total:</span>
                        <span className="text-purple-400">+20 points</span>
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

        {/* Enhanced Picks Form */}
        <div className="space-y-8">
          {event.fights.map((fight, index) => {
            const pick = picks.find(p => p.fightNumber === fight.fightNumber);
            const isIncomplete = pick && ((!pick.winner || !pick.method) || 
              (pick.method !== 'Decision' && (pick.round === undefined || pick.round === null)) ||
              ((pick.method === 'KO/TKO' || pick.method === 'Submission') && !pick.time));
            
            return (
              <div 
                key={fight.fightNumber} 
                className="group relative animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-ufc-red/10 to-ufc-gold/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                
                <div className="relative bg-gradient-to-br from-ufc-gray/95 to-gray-800/95 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl hover:shadow-ufc-red/20 transition-all duration-500 hover:scale-[1.02]">
                  {/* Fight Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-ufc-red to-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{fight.fightNumber}</span>
                        </div>
                        <span className="text-xl font-bold text-white">Fight {fight.fightNumber}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full text-sm font-semibold text-gray-200 border border-gray-500/50">
                          {fight.weightClass}
                        </span>
                        {fight.isMainEvent && (
                          <span className="px-4 py-2 bg-gradient-to-r from-ufc-red to-red-600 rounded-full text-sm font-semibold text-white border border-red-500/50 shadow-lg">
                            Main Event
                          </span>
                        )}
                        {fight.isCoMainEvent && (
                          <span className="px-4 py-2 bg-gradient-to-r from-ufc-gold to-yellow-500 rounded-full text-sm font-semibold text-black border border-yellow-400/50 shadow-lg">
                            Co-Main
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isIncomplete && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-full">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-red-300 text-sm font-medium">Incomplete</span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Fighters Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Fighter 1 */}
                    <div className="fighter-card-enhanced text-center group/fighter">
                      <div className="relative mb-4">
                        <div className="w-32 h-32 mx-auto relative">
                          {fight.fighter1.image ? (
                            <img 
                              src={fight.fighter1.image} 
                              alt={fight.fighter1.name}
                              className="w-full h-full object-cover rounded-full border-4 border-gray-600 group-hover/fighter:border-ufc-red transition-all duration-300 shadow-xl"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 rounded-full border-4 border-gray-600 group-hover/fighter:border-ufc-red transition-all duration-300 shadow-xl flex items-center justify-center">
                              <UserIcon className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          {pick?.winner === 'fighter1' && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-ufc-red to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              <CheckCircleIcon className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-2xl mb-2 group-hover/fighter:text-ufc-gold transition-colors duration-300">
                        {fight.fighter1.name}
                      </h3>
                      {fight.fighter1.nickname && (
                        <p className="text-ufc-red text-sm mb-3 font-medium italic">"{fight.fighter1.nickname}"</p>
                      )}
                                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-600/50">
                          <TrophyIcon className="h-4 w-4 text-ufc-gold" />
                          <p className="text-gray-300 text-sm font-mono">
                            {fight.fighter1.record.wins}-{fight.fighter1.record.losses}-{fight.fighter1.record.draws}
                          </p>
                        </div>
                    </div>

                    {/* VS Section */}
                    <div className="vs-section">
                      <div className="text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-ufc-red to-red-600 rounded-full flex items-center justify-center shadow-xl mb-4">
                          <span className="text-white font-bold text-2xl">VS</span>
                        </div>
                        <div className="w-36 h-1.5 bg-gradient-to-r from-ufc-red to-ufc-gold rounded-full shadow-lg"></div>
                      </div>
                    </div>

                    {/* Fighter 2 */}
                    <div className="fighter-card-enhanced text-center group/fighter">
                      <div className="relative mb-4">
                        <div className="w-32 h-32 mx-auto relative">
                          {fight.fighter2.image ? (
                            <img 
                              src={fight.fighter2.image} 
                              alt={fight.fighter2.name}
                              className="w-full h-full object-cover rounded-full border-4 border-gray-600 group-hover/fighter:border-ufc-red transition-all duration-300 shadow-xl"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 rounded-full border-4 border-gray-600 group-hover/fighter:border-ufc-red transition-all duration-300 shadow-xl flex items-center justify-center">
                              <UserIcon className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          {pick?.winner === 'fighter2' && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-ufc-red to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              <CheckCircleIcon className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-2xl mb-2 group-hover/fighter:text-ufc-gold transition-colors duration-300">
                        {fight.fighter2.name}
                      </h3>
                      {fight.fighter2.nickname && (
                        <p className="text-ufc-red text-sm mb-3 font-medium italic">"{fight.fighter2.nickname}"</p>
                      )}
                                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-600/50">
                          <TrophyIcon className="h-4 w-4 text-ufc-gold" />
                          <p className="text-gray-300 text-sm font-mono">
                            {fight.fighter2.record.wins}-{fight.fighter2.record.losses}-{fight.fighter2.record.draws}
                          </p>
                        </div>
                    </div>
                  </div>

                  {/* Enhanced Pick Options */}
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Winner Selection */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                        Winner *
                      </label>
                      <div className="space-y-3">
                        <label className="winner-option">
                          <input
                            type="radio"
                            name={`winner-${fight.fightNumber}`}
                            value="fighter1"
                            checked={pick?.winner === 'fighter1'}
                            onChange={(e) => handlePickChange(fight.fightNumber, 'winner', e.target.value)}
                            className="sr-only"
                          />
                          <div className="winner-option-content">
                            <span className="text-white font-semibold">{fight.fighter1.name}</span>
                          </div>
                        </label>
                        <label className="winner-option">
                          <input
                            type="radio"
                            name={`winner-${fight.fightNumber}`}
                            value="fighter2"
                            checked={pick?.winner === 'fighter2'}
                            onChange={(e) => handlePickChange(fight.fightNumber, 'winner', e.target.value)}
                            className="sr-only"
                          />
                          <div className="winner-option-content">
                            <span className="text-white font-semibold">{fight.fighter2.name}</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Method Selection */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                        Method *
                      </label>
                      <div className="relative">
                        <select
                          value={pick?.method || 'Decision'}
                          onChange={(e) => handlePickChange(fight.fightNumber, 'method', e.target.value)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-ufc-dark to-gray-800 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent transition-all duration-300 hover:border-gray-500/70 shadow-lg appearance-none"
                        >
                          <option value="Decision" className="bg-ufc-dark text-white">Decision</option>
                          <option value="KO/TKO" className="bg-ufc-dark text-white">KO/TKO</option>
                          <option value="Submission" className="bg-ufc-dark text-white">Submission</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Round Selection */}
                    <div className="space-y-4">
                      <label className={`block text-sm font-semibold uppercase tracking-wide ${
                        pick?.method === 'Decision' ? 'text-gray-500' : 'text-gray-300'
                      }`}>
                        Round {pick?.method === 'Decision' ? '(N/A)' : '*'}
                      </label>
                      <div className="relative">
                        <select
                          value={pick?.method === 'Decision' ? '' : (pick?.round?.toString() || '')}
                          onChange={(e) => handlePickChange(fight.fightNumber, 'round', e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={pick?.method === 'Decision'}
                          className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 appearance-none ${
                            pick?.method === 'Decision' 
                              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border-gray-600/50' 
                              : 'bg-gradient-to-r from-ufc-dark to-gray-800 text-white border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent hover:border-gray-500/70 shadow-lg'
                          }`}
                        >
                          <option value="" className="bg-ufc-dark text-white">Select Round</option>
                          <option value={1} className="bg-ufc-dark text-white">Round 1</option>
                          <option value={2} className="bg-ufc-dark text-white">Round 2</option>
                          <option value={3} className="bg-ufc-dark text-white">Round 3</option>
                          <option value={4} className="bg-ufc-dark text-white">Round 4</option>
                          <option value={5} className="bg-ufc-dark text-white">Round 5</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-4">
                      <label className={`block text-sm font-semibold uppercase tracking-wide ${
                        pick?.method === 'Decision' ? 'text-gray-500' : 'text-gray-300'
                      }`}>
                        Time {pick?.method === 'Decision' ? '(N/A)' : '*'}
                      </label>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              placeholder="0"
                              value={pick?.time ? pick.time.split(':')[0] || '' : ''}
                              onChange={(e) => {
                                let minutes = parseInt(e.target.value) || 0;
                                minutes = Math.max(0, Math.min(5, minutes));
                                const seconds = pick?.time ? pick.time.split(':')[1] || '00' : '00';
                                const newTime = `${minutes.toString().padStart(2, '0')}:${seconds}`;
                                handlePickChange(fight.fightNumber, 'time', newTime);
                              }}
                              disabled={pick?.method === 'Decision'}
                              className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 text-center font-mono text-lg ${
                                pick?.method === 'Decision' 
                                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border-gray-600/50' 
                                  : 'bg-gradient-to-r from-ufc-dark to-gray-800 text-white border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent hover:border-gray-500/70 shadow-lg'
                              }`}
                            />
                            <p className="text-xs text-gray-400 text-center mt-2 font-medium">Minutes</p>
                          </div>
                          <div className="flex items-center text-gray-400 text-2xl font-bold">
                            :
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              placeholder="00"
                              value={pick?.time ? pick.time.split(':')[1] || '' : ''}
                              onChange={(e) => {
                                let seconds = parseInt(e.target.value) || 0;
                                seconds = Math.max(0, Math.min(59, seconds));
                                const minutes = pick?.time ? pick.time.split(':')[0] || '0' : '0';
                                const newTime = `${minutes.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                handlePickChange(fight.fightNumber, 'time', newTime);
                              }}
                              disabled={pick?.method === 'Decision'}
                              className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 text-center font-mono text-lg ${
                                pick?.method === 'Decision' 
                                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border-gray-600/50' 
                                  : 'bg-gradient-to-r from-ufc-dark to-gray-800 text-white border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent hover:border-gray-500/70 shadow-lg'
                              }`}
                            />
                            <p className="text-xs text-gray-400 text-center mt-2 font-medium">Seconds</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                          {pick?.method === 'Decision' ? 'Not applicable for Decision' : 'Format: MM:SS (0:00 to 5:00)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Submit Button */}
        <div className="flex justify-center pt-8">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="group relative overflow-hidden bg-gradient-to-r from-ufc-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-5 px-16 rounded-2xl text-xl shadow-2xl hover:shadow-ufc-red/30 transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-ufc-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center">
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  {existingPick ? 'Updating Picks...' : 'Submitting Picks...'}
                </>
              ) : (
                <>
                  <TrophyIcon className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  {existingPick ? 'Update All Picks' : 'Submit All Picks'}
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakePicks; 