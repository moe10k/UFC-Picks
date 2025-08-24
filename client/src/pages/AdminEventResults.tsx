import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { EventWithFights } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Breadcrumb from '../components/Breadcrumb';
import toast from 'react-hot-toast';

interface FightResult {
  fightNumber: number;
  winner: string;
  method: string;
  round: number;
  time: string;
}

const AdminEventResults: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [event, setEvent] = useState<EventWithFights | null>(null);
  const [results, setResults] = useState<FightResult[]>([]);

  const fetchEvent = useCallback(async () => {
    try {
      const { event: eventData } = await eventsAPI.getById(id!);
      setEvent(eventData);
      
      // Initialize results from existing fight results
      const existingResults: FightResult[] = eventData.fights
        .filter(fight => fight.isCompleted && fight.winner)
        .map(fight => ({
          fightNumber: fight.fightNumber,
          winner: fight.winner || '',
          method: fight.method || '',
          round: fight.round || 1,
          time: fight.time || ''
        }));
      
      setResults(existingResults);
    } catch (error: any) {
      toast.error('Failed to load event');
      navigate('/admin/events');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, fetchEvent]);

  const handleResultChange = (fightNumber: number, field: string, value: string | number) => {
    setResults(prev => {
      const existing = prev.find(r => r.fightNumber === fightNumber);
      if (existing) {
        const updatedResult = { ...existing, [field]: value };
        
        // If method is changed to Decision, clear the time
        if (field === 'method' && value === 'Decision') {
          updatedResult.time = '';
          updatedResult.round = 1;
        }
        
        return prev.map(r => 
          r.fightNumber === fightNumber 
            ? updatedResult
            : r
        );
      } else {
        return [...prev, {
          fightNumber,
          winner: '',
          method: '',
          round: 1,
          time: '',
          [field]: value
        }];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (results.length === 0) {
      toast.error('Please enter at least one fight result');
      return;
    }

    const incompleteResults = results.filter(r => {
      if (!r.winner || !r.method) return true;
      if (r.method === 'Decision') return false;
      if (r.method === 'KO/TKO' || r.method === 'Submission') {
        return !r.time;
      }
      return false;
    });
    if (incompleteResults.length > 0) {
      toast.error('Please complete all fight results. Time is required for KO/TKO and Submission methods.');
      return;
    }

    setIsSaving(true);
    try {
      await eventsAPI.updateResults(id!, results);
      toast.success('Results updated and picks scored successfully!');
      navigate('/admin/events');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update results');
    } finally {
      setIsSaving(false);
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

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Event Not Found</h2>
        <p className="text-gray-400">The event you're looking for doesn't exist.</p>
      </div>
    );
  }

  const methods = [
    'Decision', 'KO/TKO', 'Submission'
  ];

  const rounds = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { name: 'Manage Events', href: '/admin/events' },
        { name: event?.name || 'Event' }
      ]} />
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Update Results</h1>
        <p className="text-gray-400">
          Enter fight results for {event.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Info */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-4">Event Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Date:</span>
              <span className="text-white ml-2">{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Venue:</span>
              <span className="text-white ml-2">{event.venue.name}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="text-white ml-2">{event.status}</span>
            </div>
          </div>
        </div>

        {/* Fight Results */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Fight Results</h2>
          
          <div className="space-y-6">
            {event.fights.map((fight) => {
              const result = results.find(r => r.fightNumber === fight.fightNumber);
              const isCompleted = fight.isCompleted;
              
              return (
                <div key={fight.fightNumber} className="border border-gray-600 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Fight #{fight.fightNumber} - {fight.weightClass}
                      </h3>
                      <div className="flex gap-2 mt-2">
                        {fight.isMainCard && <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Main Card</span>}
                        {fight.isMainEvent && <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">Main Event</span>}
                        {fight.isCoMainEvent && <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">Co-Main</span>}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-white">{fight.fighter1Name}</h4>
                      {fight.fighter1Nick && <p className="text-gray-400">"{fight.fighter1Nick}"</p>}
                      <p className="text-sm text-gray-500">
                        {fight.fighter1Record || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-white">{fight.fighter2Name}</h4>
                      {fight.fighter2Nick && <p className="text-gray-400">"{fight.fighter2Nick}"</p>}
                      <p className="text-sm text-gray-500">
                        {fight.fighter2Record || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-3">
                      <label className="block text-white font-medium">Winner *</label>
                      <select
                        value={result?.winner || ''}
                        onChange={(e) => handleResultChange(fight.fightNumber, 'winner', e.target.value)}
                        className="w-full px-3 py-3 bg-ufc-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent transition-all duration-200 hover:border-gray-500"
                        required
                      >
                        <option value="">Select winner</option>
                        <option value="fighter1">{fight.fighter1Name}</option>
                        <option value="fighter2">{fight.fighter2Name}</option>
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-white font-medium">Method *</label>
                      <select
                        value={result?.method || ''}
                        onChange={(e) => handleResultChange(fight.fightNumber, 'method', e.target.value)}
                        className="w-full px-3 py-3 bg-ufc-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent transition-all duration-200 hover:border-gray-500"
                        required
                      >
                        <option value="">Select method</option>
                        {methods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-white font-medium">
                        Round {result?.method === 'Decision' ? '(N/A)' : ''}
                      </label>
                      <select
                        value={result?.round || 1}
                        onChange={(e) => handleResultChange(fight.fightNumber, 'round', parseInt(e.target.value))}
                        className={`w-full px-3 py-3 border rounded-lg transition-all duration-200 ${
                          result?.method === 'Decision' 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600' 
                            : 'bg-ufc-dark text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent hover:border-gray-500'
                        }`}
                        disabled={result?.method === 'Decision'}
                      >
                        {rounds.map(round => (
                          <option key={round} value={round}>{round}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-white font-medium">
                        Time {result?.method === 'Decision' ? '(N/A)' : '*'}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            placeholder="0"
                            value={result?.time ? result.time.split(':')[0] || '' : ''}
                            onChange={(e) => {
                              let minutes = parseInt(e.target.value) || 0;
                              // Ensure minutes is between 0-5
                              minutes = Math.max(0, Math.min(5, minutes));
                              const seconds = result?.time ? result.time.split(':')[1] || '00' : '00';
                              const newTime = `${minutes.toString().padStart(2, '0')}:${seconds}`;
                              handleResultChange(fight.fightNumber, 'time', newTime);
                            }}
                            disabled={result?.method === 'Decision'}
                            className={`w-full px-3 py-3 border rounded-lg transition-all duration-200 text-center ${
                              result?.method === 'Decision' 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600' 
                                : 'bg-ufc-dark text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent hover:border-gray-500'
                            }`}
                          />
                          <p className="text-xs text-gray-400 text-center mt-1">Minutes</p>
                        </div>
                        <div className="flex items-center text-gray-400 text-xl font-bold">
                          :
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            placeholder="00"
                            value={result?.time ? result.time.split(':')[1] || '' : ''}
                            onChange={(e) => {
                              let seconds = parseInt(e.target.value) || 0;
                              // Ensure seconds is between 0-59
                              seconds = Math.max(0, Math.min(59, seconds));
                              const minutes = result?.time ? result.time.split(':')[0] || '0' : '0';
                              const newTime = `${minutes.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                              handleResultChange(fight.fightNumber, 'time', newTime);
                            }}
                            disabled={result?.method === 'Decision'}
                            className={`w-full px-3 py-3 border rounded-lg transition-all duration-200 text-center ${
                              result?.method === 'Decision' 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600' 
                                : 'bg-ufc-dark text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent hover:border-gray-500'
                            }`}
                          />
                          <p className="text-xs text-gray-400 text-center mt-1">Seconds</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {result?.method === 'Decision' ? 'Not applicable for Decision' : 'Format: MM:SS (0:00 to 5:00)'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning */}
        <div className="card bg-yellow-900 border-yellow-600">
          <h3 className="text-lg font-bold text-yellow-200 mb-2">⚠️ Important Notice</h3>
          <p className="text-yellow-100">
            Once you submit these results, all user picks for this event will be automatically scored. 
            This action cannot be undone. Make sure all results are correct before submitting.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Updating Results...' : 'Update Results & Score Picks'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEventResults;
