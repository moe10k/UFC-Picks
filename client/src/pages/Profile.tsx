import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File too large. Max 2MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }
    setUploading(true);
    try {
      await uploadAvatar(selectedFile);
      toast.success('Avatar uploaded!');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload avatar';
      toast.error(message);
    } finally {
      setUploading(false);
    }
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
                  alt={`@${user.username}`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <UserIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                @{user.username}
              </h1>
              <p className="text-gray-400 text-lg">
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
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload an image (max 2MB)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-gray-300"
                />
              </div>
              {previewUrl && (
                <div className="mt-4 flex items-center gap-4">
                  <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                  <span className="text-gray-400 text-sm">Preview</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload Avatar'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
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
              {user.stats.averageAccuracy ? `${user.stats.averageAccuracy.toFixed(1)}%` : '0%'}
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