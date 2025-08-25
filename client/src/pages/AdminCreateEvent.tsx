import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import FighterImageUpload from '../components/FighterImageUpload';
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

const AdminCreateEvent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venueName: '',
    venueCity: '',
    venueState: '',
    venueCountry: '',
    description: '',
    pickDeadline: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFighterChange = (fighterIndex: 1 | 2, field: string, value: any) => {
    setNewFight(prev => ({
      ...prev,
      [`fighter${fighterIndex}`]: {
        ...(prev[`fighter${fighterIndex}` as keyof Fight] as Fighter),
        [field]: value
      }
    }));
  };

  const handleRecordChange = (fighterIndex: 1 | 2, field: string, value: number) => {
    setNewFight(prev => ({
      ...prev,
      [`fighter${fighterIndex}`]: {
        ...(prev[`fighter${fighterIndex}` as keyof Fight] as Fighter),
        record: {
          ...(prev[`fighter${fighterIndex}` as keyof Fight] as Fighter).record,
          [field]: value
        }
      }
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
      toast.error('Please fill in all required fields and add at least one fight');
      return;
    }

    setIsLoading(true);
    try {
      await eventsAPI.create(formData);
      toast.success('Event created successfully!');
      navigate('/admin/events');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Create New Event</h1>
        <p className="text-gray-400">Add a new UFC event with fights</p>
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
          <div>
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
        </div>

        {/* Add Fight Form */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Add Fight</h2>
          
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
                    onChange={(e) => handleFighterChange(1, 'name', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="Fighter Name"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Nickname</label>
                  <input
                    type="text"
                    value={newFight.fighter1.nickname}
                    onChange={(e) => handleFighterChange(1, 'nickname', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="The Fighter"
                  />
                </div>
                
                <div>
                  <FighterImageUpload
                    fighterNumber={1}
                    currentImageUrl={newFight.fighter1.image}
                    onImageChange={(url) => handleFighterChange(1, 'image', url)}
                    onImageRemove={() => handleFighterChange(1, 'image', '')}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-white font-medium mb-2">Wins</label>
                    <input
                      type="number"
                      value={newFight.fighter1.record.wins}
                      onChange={(e) => handleRecordChange(1, 'wins', parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Losses</label>
                    <input
                      type="number"
                      value={newFight.fighter1.record.losses}
                      onChange={(e) => handleRecordChange(1, 'losses', parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Draws</label>
                    <input
                      type="number"
                      value={newFight.fighter1.record.draws}
                      onChange={(e) => handleRecordChange(1, 'draws', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => handleFighterChange(2, 'name', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="Fighter Name"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Nickname</label>
                  <input
                    type="text"
                    value={newFight.fighter2.nickname}
                    onChange={(e) => handleFighterChange(2, 'nickname', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    placeholder="The Fighter"
                  />
                </div>
                
                <div>
                  <FighterImageUpload
                    fighterNumber={2}
                    currentImageUrl={newFight.fighter2.image}
                    onImageChange={(url) => handleFighterChange(2, 'image', url)}
                    onImageRemove={() => handleFighterChange(2, 'image', '')}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-white font-medium mb-2">Wins</label>
                    <input
                      type="number"
                      value={newFight.fighter2.record.wins}
                      onChange={(e) => handleRecordChange(2, 'wins', parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Losses</label>
                    <input
                      type="number"
                      value={newFight.fighter2.record.losses}
                      onChange={(e) => handleRecordChange(2, 'losses', parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Draws</label>
                    <input
                      type="number"
                      value={newFight.fighter2.record.draws}
                      onChange={(e) => handleRecordChange(2, 'draws', parseInt(e.target.value) || 0)}
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

        {/* Added Fights */}
        {formData.fights.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6">Added Fights ({formData.fights.length})</h2>
            
            <div className="space-y-4">
              {formData.fights.map((fight, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4">
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
                      onClick={() => removeFight(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-white">{fight.fighter1.name}</h4>
                      {fight.fighter1.nickname && <p className="text-gray-400">"{fight.fighter1.nickname}"</p>}
                      <p className="text-sm text-gray-500">
                        {fight.fighter1.record.wins}-{fight.fighter1.record.losses}
                        {fight.fighter1.record.draws > 0 && `-${fight.fighter1.record.draws}`}
                      </p>
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-white">{fight.fighter2.name}</h4>
                      {fight.fighter2.nickname && <p className="text-gray-400">"{fight.fighter2.nickname}"</p>}
                      <p className="text-sm text-gray-500">
                        {fight.fighter2.record.wins}-{fight.fighter2.record.losses}
                        {fight.fighter2.record.draws > 0 && `-${fight.fighter2.record.draws}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary"
            disabled={formData.fights.length === 0}
          >
            Create Event
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateEvent;
