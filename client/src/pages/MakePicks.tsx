import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const { event: eventData } = await eventsAPI.getById(id);
        setEvent(eventData);
        
        // Initialize picks for each fight
        const initialPicks: Pick[] = eventData.fights.map((fight: Fight) => ({
          fightNumber: fight.fightNumber,
          winner: 'fighter1',
          method: 'Decision',
          round: 3
        }));
        setPicks(initialPicks);
      } catch (error: any) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handlePickChange = (fightNumber: number, field: keyof Pick, value: any) => {
    setPicks(prevPicks => 
      prevPicks.map(pick => 
        pick.fightNumber === fightNumber 
          ? { ...pick, [field]: value }
          : pick
      )
    );
  };

  const validatePicks = () => {
    if (!picks.length) {
      toast.error('No picks to submit');
      return false;
    }

    const hasInvalidPicks = picks.some(pick => 
      !pick.winner || !pick.method || !pick.round
    );

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
      
      toast.success('Picks submitted successfully!');
      navigate(`/event/${id}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit picks';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              Make Your Picks
            </h1>
            <h2 className="text-xl text-gray-300 mb-4">
              {event.name}
            </h2>
            
            <div className="flex items-center gap-2 text-yellow-400">
              <ClockIcon className="h-5 w-5" />
              <span className="text-sm">
                Deadline: {format(new Date(event.pickDeadline), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
          
          <div className="lg:flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary px-8 py-3 text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Picks'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Picks Form */}
      <div className="space-y-6">
        {event.fights.map((fight) => {
          const pick = picks.find(p => p.fightNumber === fight.fightNumber);
          
          return (
            <div key={fight.fightNumber} className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">Fight {fight.fightNumber}</span>
                  <span className="px-3 py-1 bg-gray-700 rounded-full text-sm font-medium text-gray-300">
                    {fight.weightClass}
                  </span>
                  {fight.isMainEvent && (
                    <span className="px-3 py-1 bg-ufc-red rounded-full text-sm font-medium text-white">
                      Main Event
                    </span>
                  )}
                  {fight.isCoMainEvent && (
                    <span className="px-3 py-1 bg-ufc-gold rounded-full text-sm font-medium text-black">
                      Co-Main
                    </span>
                  )}
                </div>
              </div>

              {/* Fighters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="fighter-card text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                    {fight.fighter1.image ? (
                      <img 
                        src={fight.fighter1.image} 
                        alt={fight.fighter1.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-400">?</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-xl mb-1">
                    {fight.fighter1.name}
                  </h3>
                  {fight.fighter1.nickname && (
                    <p className="text-ufc-red text-sm mb-2">"{fight.fighter1.nickname}"</p>
                  )}
                  <p className="text-gray-400 text-sm">
                    {fight.fighter1.record.wins}-{fight.fighter1.record.losses}-{fight.fighter1.record.draws}
                  </p>
                </div>

                <div className="fighter-card text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                    {fight.fighter2.image ? (
                      <img 
                        src={fight.fighter2.image} 
                        alt={fight.fighter2.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-400">?</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-xl mb-1">
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

              {/* Pick Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Winner */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Winner
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`winner-${fight.fightNumber}`}
                        value="fighter1"
                        checked={pick?.winner === 'fighter1'}
                        onChange={(e) => handlePickChange(fight.fightNumber, 'winner', e.target.value)}
                        className="mr-3 text-ufc-red focus:ring-ufc-red"
                      />
                      <span className="text-white">{fight.fighter1.name}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`winner-${fight.fightNumber}`}
                        value="fighter2"
                        checked={pick?.winner === 'fighter2'}
                        onChange={(e) => handlePickChange(fight.fightNumber, 'winner', e.target.value)}
                        className="mr-3 text-ufc-red focus:ring-ufc-red"
                      />
                      <span className="text-white">{fight.fighter2.name}</span>
                    </label>
                  </div>
                </div>

                {/* Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Method
                  </label>
                  <select
                    value={pick?.method || 'Decision'}
                    onChange={(e) => handlePickChange(fight.fightNumber, 'method', e.target.value)}
                    className="input-field"
                  >
                    <option value="Decision">Decision</option>
                    <option value="KO/TKO">KO/TKO</option>
                    <option value="Submission">Submission</option>
                  </select>
                </div>

                {/* Round */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Round
                  </label>
                  <select
                    value={pick?.round || 3}
                    onChange={(e) => handlePickChange(fight.fightNumber, 'round', parseInt(e.target.value))}
                    className="input-field"
                  >
                    <option value={1}>Round 1</option>
                    <option value={2}>Round 2</option>
                    <option value={3}>Round 3</option>
                    <option value={4}>Round 4</option>
                    <option value={5}>Round 5</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary px-12 py-4 text-xl"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
              Submitting Picks...
            </div>
          ) : (
            'Submit All Picks'
          )}
        </button>
      </div>
    </div>
  );
};

export default MakePicks; 