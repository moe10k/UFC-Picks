import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { EventWithFights } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import FighterImageUpload from '../components/FighterImageUpload';
import { formatFighterRecord } from '../utils/formatRecord';
import toast from 'react-hot-toast';

interface Fighter {
  name: string;
  nickname: string;
  image: string;
  record: {
    wins: number;
    losses: number;
    draws: number;
  };
  stats: {
    age?: number;
    height?: string;
    weight?: string;
    reach?: string;
    stance?: string;
    hometown?: string;
  };
}

interface Fight {
  fightNumber: number;
  weightClass: string;
  isMainCard: boolean;
  isMainEvent: boolean;
  isCoMainEvent: boolean;
  fighter1: Fighter;
  fighter2: Fighter;
  isCompleted: boolean;
}

const AdminEditEvent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [event, setEvent] = useState<EventWithFights | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venueName: '',
    venueCity: '',
    venueState: '',
    venueCountry: '',
    description: '',
    pickDeadline: '',
    status: 'upcoming' as 'upcoming' | 'live' | 'completed',
    fights: [] as Fight[]
  });

  const [newFight, setNewFight] = useState<Fight>({
    fightNumber: 1,
    weightClass: '',
    isMainCard: true,
    isMainEvent: false,
    isCoMainEvent: false,
    fighter1: {
      name: '',
      nickname: '',
      image: '',
      record: { wins: 0, losses: 0, draws: 0 },
      stats: {}
    },
    fighter2: {
      name: '',
      nickname: '',
      image: '',
      record: { wins: 0, losses: 0, draws: 0 },
      stats: {}
    },
    isCompleted: false
  });

  const weightClasses = [
    'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 
    'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
    'Women\'s Strawweight', 'Women\'s Flyweight', 'Women\'s Bantamweight', 'Women\'s Featherweight'
  ];

  const fetchEvent = useCallback(async () => {
    try {
      const { event: eventData } = await eventsAPI.getById(id!);
      setEvent(eventData);
      
      // Convert existing fights to the new format
      const convertedFights: Fight[] = eventData.fights.map(fight => ({
        fightNumber: fight.fightNumber,
        weightClass: fight.weightClass,
        isMainCard: fight.isMainCard,
        isMainEvent: fight.isMainEvent,
        isCoMainEvent: fight.isCoMainEvent,
        fighter1: {
          name: fight.fighter1Name,
          nickname: fight.fighter1Nick || '',
          image: fight.fighter1Image || '',
          record: {
            wins: parseInt(fight.fighter1Record.split('-')[0]) || 0,
            losses: parseInt(fight.fighter1Record.split('-')[1]) || 0,
            draws: parseInt(fight.fighter1Record.split('-')[2]) || 0
          },
          stats: {}
        },
        fighter2: {
          name: fight.fighter2Name,
          nickname: fight.fighter2Nick || '',
          image: fight.fighter2Image || '',
          record: {
            wins: parseInt(fight.fighter2Record.split('-')[0]) || 0,
            losses: parseInt(fight.fighter2Record.split('-')[1]) || 0,
            draws: parseInt(fight.fighter2Record.split('-')[2]) || 0
          },
          stats: {}
        },
        isCompleted: fight.isCompleted
      }));

      setFormData({
        name: eventData.name,
        date: new Date(eventData.date).toISOString().slice(0, 16),
        venueName: eventData.venue.name,
        venueCity: eventData.venue.city,
        venueState: eventData.venue.state || '',
        venueCountry: eventData.venue.country,
        description: eventData.description || '',
        pickDeadline: new Date(eventData.pickDeadline).toISOString().slice(0, 16),
        status: eventData.status,
        fights: convertedFights
      });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFighterChange = (fightIndex: number, fighterIndex: 1 | 2, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fights: prev.fights.map((fight, i) => 
        i === fightIndex ? {
          ...fight,
          [`fighter${fighterIndex}`]: {
            ...(fight[`fighter${fighterIndex}` as keyof Fight] as Fighter),
            [field]: value
          }
        } : fight
      )
    }));
  };

  const handleRecordChange = (fightIndex: number, fighterIndex: 1 | 2, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      fights: prev.fights.map((fight, i) => 
        i === fightIndex ? {
          ...fight,
          [`fighter${fighterIndex}`]: {
            ...(fight[`fighter${fighterIndex}` as keyof Fight] as Fighter),
            record: {
              ...(fight[`fighter${fighterIndex}` as keyof Fight] as Fighter).record,
              [field]: value
            }
          }
        } : fight
      )
    }));
  };

  const addFight = () => {
    if (!newFight.weightClass || !newFight.fighter1.name || !newFight.fighter2.name) {
      toast.error('Please fill in all required fight details');
      return;
    }

    setFormData(prev => ({
      ...prev,
      fights: [...prev.fights, { ...newFight, fightNumber: prev.fights.length + 1 }]
    }));

    setNewFight({
      fightNumber: formData.fights.length + 2,
      weightClass: '',
      isMainCard: true,
      isMainEvent: false,
      isCoMainEvent: false,
      fighter1: { name: '', nickname: '', image: '', record: { wins: 0, losses: 0, draws: 0 }, stats: {} },
      fighter2: { name: '', nickname: '', image: '', record: { wins: 0, losses: 0, draws: 0 }, stats: {} },
      isCompleted: false
    });
  };

  const removeFight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fights: prev.fights.filter((_, i) => i !== index).map((fight, i) => ({
        ...fight,
        fightNumber: i + 1
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date || !formData.venueName || formData.fights.length === 0) {
      toast.error('Please fill in all required fields and ensure at least one fight exists');
      return;
    }

    setIsSaving(true);
    try {
      // Convert fights back to the API format
      const apiFights = formData.fights.map(fight => ({
        fightNumber: fight.fightNumber,
        weightClass: fight.weightClass,
        isMainCard: fight.isMainCard,
        isMainEvent: fight.isMainEvent,
        isCoMainEvent: fight.isCoMainEvent,
        fighter1Name: fight.fighter1.name,
        fighter1Nick: fight.fighter1.nickname,
        fighter1Image: fight.fighter1.image,
        fighter1Record: `${fight.fighter1.record.wins}-${fight.fighter1.record.losses}${fight.fighter1.record.draws > 0 ? `-${fight.fighter1.record.draws}` : ''}`,
        fighter2Name: fight.fighter2.name,
        fighter2Nick: fight.fighter2.nickname,
        fighter2Image: fight.fighter2.image,
        fighter2Record: `${fight.fighter2.record.wins}-${fight.fighter2.record.losses}${fight.fighter2.record.draws > 0 ? `-${fight.fighter2.record.draws}` : ''}`,
        isCompleted: fight.isCompleted
      }));

      await eventsAPI.update(id!, {
        ...formData,
        venue: {
          name: formData.venueName,
          city: formData.venueCity,
          state: formData.venueState,
          country: formData.venueCountry
        },
        fights: apiFights
      });
      toast.success('Event updated successfully!');
      navigate('/admin/events');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update event');
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Edit Event</h1>
        <p className="text-gray-400">Update event details and information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Details */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Event Details</h2>
          
          {/* Event Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Event Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2">Event Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="UFC 320: Main Event vs. Co-Main"
                required
              />
            </div>
            
              <div className="md:col-span-2">
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  rows={3}
                  placeholder="Brief description of the event..."
              />
            </div>
            </div>
            </div>
            
          {/* Venue Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Venue Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Venue Name *</label>
              <input
                type="text"
                name="venueName"
                value={formData.venueName}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="T-Mobile Arena"
                required
              />
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Venue City *</label>
              <input
                type="text"
                name="venueCity"
                value={formData.venueCity}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="Las Vegas"
                required
              />
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Venue State</label>
              <input
                type="text"
                name="venueState"
                value={formData.venueState}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="Nevada"
              />
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Venue Country *</label>
              <input
                type="text"
                name="venueCountry"
                value={formData.venueCountry}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="United States"
                required
              />
            </div>
            </div>
          </div>

          {/* Timing Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Timing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Event Date *</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                required
              />
            </div>
            
              <div>
                <label className="block text-white font-medium mb-2">Pick Deadline *</label>
                <input
                  type="datetime-local"
                  name="pickDeadline"
                  value={formData.pickDeadline}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  required
              />
            </div>
          </div>
        </div>

          {/* Event Status */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Event Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Existing Fights */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Edit Existing Fights ({formData.fights.length})</h2>
          
          <div className="space-y-6">
            {formData.fights.map((fight, fightIndex) => (
              <div key={fightIndex} className="border border-gray-600 rounded-lg p-4">
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
                  <button
                    type="button"
                    onClick={() => removeFight(fightIndex)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                {/* Fight Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Weight Class</label>
                    <select
                      value={fight.weightClass}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          fights: prev.fights.map((f, i) => 
                            i === fightIndex ? { ...f, weightClass: e.target.value } : f
                          )
                        }));
                      }}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    >
                      {weightClasses.map(wc => (
                        <option key={wc} value={wc}>{wc}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={fight.isMainCard}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            fights: prev.fights.map((f, i) => 
                              i === fightIndex ? { ...f, isMainCard: e.target.checked } : f
                            )
                          }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-white">Main Card</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={fight.isMainEvent}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            fights: prev.fights.map((f, i) => 
                              i === fightIndex ? { ...f, isMainEvent: e.target.checked } : f
                            )
                          }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-white">Main Event</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={fight.isCoMainEvent}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            fights: prev.fights.map((f, i) => 
                              i === fightIndex ? { ...f, isCoMainEvent: e.target.checked } : f
                            )
                          }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-white">Co-Main</span>
                    </label>
                  </div>
                </div>

                {/* Fighter Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fighter 1 */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-white mb-4">Fighter 1</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white font-medium mb-2">Name *</label>
                        <input
                          type="text"
                          value={fight.fighter1.name}
                          onChange={(e) => handleFighterChange(fightIndex, 1, 'name', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          placeholder="Fighter Name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-white font-medium mb-2">Nickname</label>
                        <input
                          type="text"
                          value={fight.fighter1.nickname}
                          onChange={(e) => handleFighterChange(fightIndex, 1, 'nickname', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          placeholder="The Fighter"
                        />
                      </div>
                      
                      <div>
                        <FighterImageUpload
                          fighterNumber={1}
                          currentImageUrl={fight.fighter1.image}
                          onImageChange={(url) => handleFighterChange(fightIndex, 1, 'image', url)}
                          onImageRemove={() => handleFighterChange(fightIndex, 1, 'image', '')}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-white font-medium mb-2">Wins</label>
                          <input
                            type="number"
                            value={fight.fighter1.record.wins}
                            onChange={(e) => handleRecordChange(fightIndex, 1, 'wins', parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Losses</label>
                          <input
                            type="number"
                            value={fight.fighter1.record.losses}
                            onChange={(e) => handleRecordChange(fightIndex, 1, 'losses', parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Draws</label>
                          <input
                            type="number"
                            value={fight.fighter1.record.draws}
                            onChange={(e) => handleRecordChange(fightIndex, 1, 'draws', parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fighter 2 */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-white mb-4">Fighter 2</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white font-medium mb-2">Name *</label>
                        <input
                          type="text"
                          value={fight.fighter2.name}
                          onChange={(e) => handleFighterChange(fightIndex, 2, 'name', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          placeholder="Fighter Name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-white font-medium mb-2">Nickname</label>
                        <input
                          type="text"
                          value={fight.fighter2.nickname}
                          onChange={(e) => handleFighterChange(fightIndex, 2, 'nickname', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          placeholder="The Fighter"
                        />
                      </div>
                      
                      <div>
                        <FighterImageUpload
                          fighterNumber={2}
                          currentImageUrl={fight.fighter2.image}
                          onImageChange={(url) => handleFighterChange(fightIndex, 2, 'image', url)}
                          onImageRemove={() => handleFighterChange(fightIndex, 2, 'image', '')}
                        />
                </div>
                
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-white font-medium mb-2">Wins</label>
                          <input
                            type="number"
                            value={fight.fighter2.record.wins}
                            onChange={(e) => handleRecordChange(fightIndex, 2, 'wins', parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Losses</label>
                          <input
                            type="number"
                            value={fight.fighter2.record.losses}
                            onChange={(e) => handleRecordChange(fightIndex, 2, 'losses', parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Draws</label>
                          <input
                            type="number"
                            value={fight.fighter2.record.draws}
                            onChange={(e) => handleRecordChange(fightIndex, 2, 'draws', parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                            min="0"
                          />
                        </div>
                      </div>
                  </div>
                  </div>
                </div>
                
                {/* Fight Results (if completed) */}
                {fight.isCompleted && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <h5 className="font-semibold text-white mb-2">Result</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Winner:</span>
                        <span className="text-white ml-2">{event.fights[fightIndex].winner}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white ml-2">{event.fights[fightIndex].method}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Round:</span>
                        <span className="text-white ml-2">{event.fights[fightIndex].round}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white ml-2">{event.fights[fightIndex].time}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Fight Form */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Add New Fight</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-white font-medium mb-2">Weight Class *</label>
              <select
                value={newFight.weightClass}
                onChange={(e) => setNewFight(prev => ({ ...prev, weightClass: e.target.value }))}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value="">Select weight class</option>
                {weightClasses.map(wc => (
                  <option key={wc} value={wc}>{wc}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newFight.isMainCard}
                  onChange={(e) => setNewFight(prev => ({ ...prev, isMainCard: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-white">Main Card</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newFight.isMainEvent}
                  onChange={(e) => setNewFight(prev => ({ ...prev, isMainEvent: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-white">Main Event</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newFight.isCoMainEvent}
                  onChange={(e) => setNewFight(prev => ({ ...prev, isCoMainEvent: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-white">Co-Main</span>
              </label>
            </div>
          </div>

          {/* Fighter 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Fighter 1</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newFight.fighter1.name}
                    onChange={(e) => setNewFight(prev => ({
                      ...prev,
                      fighter1: { ...prev.fighter1, name: e.target.value }
                    }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="Fighter Name"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Nickname</label>
                  <input
                    type="text"
                    value={newFight.fighter1.nickname}
                    onChange={(e) => setNewFight(prev => ({
                      ...prev,
                      fighter1: { ...prev.fighter1, nickname: e.target.value }
                    }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="The Fighter"
                  />
                </div>
                
                <div>
                  <FighterImageUpload
                    fighterNumber={1}
                    currentImageUrl={newFight.fighter1.image}
                    onImageChange={(url) => setNewFight(prev => ({
                      ...prev,
                      fighter1: { ...prev.fighter1, image: url }
                    }))}
                    onImageRemove={() => setNewFight(prev => ({
                      ...prev,
                      fighter1: { ...prev.fighter1, image: '' }
                    }))}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-white font-medium mb-2">Wins</label>
                    <input
                      type="number"
                      value={newFight.fighter1.record.wins}
                      onChange={(e) => setNewFight(prev => ({
                        ...prev,
                        fighter1: {
                          ...prev.fighter1,
                          record: { ...prev.fighter1.record, wins: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Losses</label>
                    <input
                      type="number"
                      value={newFight.fighter1.record.losses}
                      onChange={(e) => setNewFight(prev => ({
                        ...prev,
                        fighter1: {
                          ...prev.fighter1,
                          record: { ...prev.fighter1.record, losses: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Draws</label>
                    <input
                      type="number"
                      value={newFight.fighter1.record.draws}
                      onChange={(e) => setNewFight(prev => ({
                        ...prev,
                        fighter1: {
                          ...prev.fighter1,
                          record: { ...prev.fighter1.record, draws: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fighter 2 */}
            <div className="border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Fighter 2</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newFight.fighter2.name}
                    onChange={(e) => setNewFight(prev => ({
                      ...prev,
                      fighter2: { ...prev.fighter2, name: e.target.value }
                    }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="Fighter Name"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Nickname</label>
                  <input
                    type="text"
                    value={newFight.fighter2.nickname}
                    onChange={(e) => setNewFight(prev => ({
                      ...prev,
                      fighter2: { ...prev.fighter2, nickname: e.target.value }
                    }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="The Fighter"
                  />
                </div>
                
                <div>
                  <FighterImageUpload
                    fighterNumber={2}
                    currentImageUrl={newFight.fighter2.image}
                    onImageChange={(url) => setNewFight(prev => ({
                      ...prev,
                      fighter2: { ...prev.fighter2, image: url }
                    }))}
                    onImageRemove={() => setNewFight(prev => ({
                      ...prev,
                      fighter2: { ...prev.fighter2, image: '' }
                    }))}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-white font-medium mb-2">Wins</label>
                    <input
                      type="number"
                      value={newFight.fighter2.record.wins}
                      onChange={(e) => setNewFight(prev => ({
                        ...prev,
                        fighter2: {
                          ...prev.fighter2,
                          record: { ...prev.fighter2.record, wins: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Losses</label>
                    <input
                      type="number"
                      value={newFight.fighter2.record.losses}
                      onChange={(e) => setNewFight(prev => ({
                        ...prev,
                        fighter2: {
                          ...prev.fighter2,
                          record: { ...prev.fighter2.record, losses: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Draws</label>
                    <input
                      type="number"
                      value={newFight.fighter2.record.draws}
                      onChange={(e) => setNewFight(prev => ({
                        ...prev,
                        fighter2: {
                          ...prev.fighter2,
                          record: { ...prev.fighter2.record, draws: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

            <button
              type="button"
            onClick={addFight}
              className="btn-secondary"
            >
            Add Fight
            </button>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving || formData.fights.length === 0}
          >
            {isSaving ? 'Saving...' : 'Update Event'}
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

export default AdminEditEvent;
