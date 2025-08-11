import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const Security: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Password requirements with real-time validation (same as registration)
  const passwordRequirements = useMemo(() => [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (password: string) => password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'At least 1 uppercase letter',
      test: (password: string) => /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least 1 lowercase letter',
      test: (password: string) => /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least 1 number',
      test: (password: string) => /\d/.test(password),
    },
    {
      id: 'special',
      label: 'At least 1 special character (@$!%*?&)',
      test: (password: string) => /[@$!%*?&]/.test(password),
    },
  ], []);

  // Check if all password requirements are met
  const isPasswordValid = useMemo(() => {
    return passwordRequirements.every(req => req.test(newPassword));
  }, [newPassword, passwordRequirements]);

  // Check if passwords match
  const doPasswordsMatch = useMemo(() => {
    return newPassword === confirmPassword && newPassword.length > 0;
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Please ensure your new password meets all requirements');
      return;
    }

    if (!doPasswordsMatch) {
      toast.error('New passwords do not match');
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const confirmPasswordChange = async () => {
    setIsLoading(true);
    setShowConfirmation(false);
    
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      // Show success message
      toast.success('Password changed successfully! You will be logged out to secure your account.');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Wait a moment for the user to see the success message, then logout and redirect
      setTimeout(() => {
        logout();
        navigate('/login');
        toast.success('Please log in with your new password');
      }, 2000);
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPasswordChange = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-ufc-gray rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <ShieldCheckIcon className="w-8 h-8 text-ufc-red mr-3" />
          <h1 className="text-2xl font-bold text-white">Security Settings</h1>
        </div>

        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Account Information</h2>
          <p className="text-gray-300 text-sm">Username: <span className="text-white">@{user?.username}</span></p>
          <p className="text-gray-300 text-sm">Email: <span className="text-white">{user?.email}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ufc-red focus:border-transparent"
                placeholder="Enter your current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showCurrentPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 ${
                  newPassword.length > 0
                    ? isPasswordValid
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                      : 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                    : 'border-gray-600 focus:ring-ufc-red focus:border-ufc-red'
                }`}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10">
                <p className="text-xs font-medium text-gray-200 mb-2">Password Requirements:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((requirement) => {
                    const isMet = requirement.test(newPassword);
                    return (
                      <div key={requirement.id} className="flex items-center space-x-2">
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                          isMet ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          {isMet ? (
                            <CheckIcon className="w-3 h-3 text-white" />
                          ) : (
                            <XMarkIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          isMet ? 'text-green-300' : 'text-gray-400'
                        }`}>
                          {requirement.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 ${
                  confirmPassword.length > 0
                    ? doPasswordsMatch
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                      : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-600 focus:ring-ufc-red focus:border-ufc-red'
                }`}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className="mt-2 flex items-center space-x-2">
                <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                  doPasswordsMatch ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {doPasswordsMatch ? (
                    <CheckIcon className="w-3 h-3 text-white" />
                  ) : (
                    <XMarkIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-xs ${
                  doPasswordsMatch ? 'text-green-300' : 'text-red-300'
                }`}>
                  {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
              className="px-6 py-3 bg-ufc-red text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-ufc-gray rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Password Change</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to change your password? You will be logged out and need to sign in again with your new password.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelPasswordChange}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPasswordChange}
                  disabled={isLoading}
                  className="px-4 py-2 bg-ufc-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Confirm Change'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">Security Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Use a strong password with a mix of letters, numbers, and symbols</li>
            <li>• Never share your password with anyone</li>
            <li>• Consider using a password manager for better security</li>
            <li>• Change your password regularly</li>
            <li>• You will be automatically logged out after changing your password for security</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Security;
