import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatar: user?.avatar || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatar: formData.avatar || undefined
      });
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
        <p className="text-gray-400">Unable to load user profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <UserIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-400 text-lg">
                @{user.username}
              </p>
              <p className="text-gray-500">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="lg:flex-shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-outline flex items-center gap-2"
            >
              <PencilIcon className="h-5 w-5" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      {isEditing && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-2">
                Avatar URL (Optional)
              </label>
              <input
                id="avatar"
                name="avatar"
                type="url"
                value={formData.avatar}
                onChange={handleChange}
                className="input-field"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Overview */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-6">Your Stats</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-ufc-red mb-2">
              {user.stats.totalPoints}
            </div>
            <div className="text-gray-400 text-sm">Total Points</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {user.stats.totalPicks > 0 
                ? `${((user.stats.correctPicks / user.stats.totalPicks) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <div className="text-gray-400 text-sm">Accuracy</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {user.stats.correctPicks}/{user.stats.totalPicks}
            </div>
            <div className="text-gray-400 text-sm">Correct Picks</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {user.stats.eventsParticipated}
            </div>
            <div className="text-gray-400 text-sm">Events</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Stats */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Performance</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Best Event Score</span>
              <span className="text-white font-medium">{user.stats.bestEventScore}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Streak</span>
              <span className="text-white font-medium">{user.stats.currentStreak}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Longest Streak</span>
              <span className="text-white font-medium">{user.stats.longestStreak}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Picks Made</span>
              <span className="text-white font-medium">{user.stats.totalPicks}</span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Username</span>
              <span className="text-white font-medium">@{user.username}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Email</span>
              <span className="text-white font-medium">{user.email}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Account Type</span>
              <span className="text-white font-medium">
                {user.isAdmin ? 'Administrator' : 'User'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="card text-center">
        <h3 className="text-xl font-bold text-white mb-4">Ready to improve your stats?</h3>
        <p className="text-gray-400 mb-6">
          Make picks for upcoming events to earn more points and climb the leaderboard!
        </p>
        <a href="/dashboard" className="btn-primary">
          View Upcoming Events
        </a>
      </div>
    </div>
  );
};

export default Profile; 