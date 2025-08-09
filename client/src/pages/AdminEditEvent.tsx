import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminEditEvent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venueName: '',
    venueCity: '',
    venueState: '',
    venueCountry: '',
    description: '',
    pickDeadline: '',
    status: 'upcoming' as 'upcoming' | 'live' | 'completed'
  });

  const fetchEvent = useCallback(async () => {
    try {
      const { event: eventData } = await eventsAPI.getById(id!);
      setEvent(eventData);
      setFormData({
        name: eventData.name,
        date: new Date(eventData.date).toISOString().slice(0, 16),
        venueName: eventData.venue.name,
        venueCity: eventData.venue.city,
        venueState: eventData.venue.state || '',
        venueCountry: eventData.venue.country,
        description: eventData.description || '',
        pickDeadline: new Date(eventData.pickDeadline).toISOString().slice(0, 16),
        status: eventData.status
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date || !formData.venueName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await eventsAPI.update(id!, {
        ...formData,
        venue: {
          name: formData.venueName,
          city: formData.venueCity,
          state: formData.venueState,
          country: formData.venueCountry
        }
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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

        {/* Current Fights */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Current Fights ({event.fights.length})</h2>
          
          <div className="space-y-4">
            {event.fights.map((fight, index) => (
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
                  {fight.isCompleted && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      Completed
                    </span>
                  )}
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
                
                {fight.result && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <h5 className="font-semibold text-white mb-2">Result</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Winner:</span>
                        <span className="text-white ml-2">{fight.result.winner}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white ml-2">{fight.result.method}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Round:</span>
                        <span className="text-white ml-2">{fight.result.round}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white ml-2">{fight.result.time}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 mb-4">
              Fight details cannot be edited here. Use the Results page to update fight outcomes.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/admin/events/${id}/results`)}
              className="btn-secondary"
            >
              Update Results
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
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
