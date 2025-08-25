import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password requirements with real-time validation
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
    return passwordRequirements.every(req => req.test(formData.password));
  }, [formData.password, passwordRequirements]);

  // Check if passwords match
  const doPasswordsMatch = useMemo(() => {
    return formData.password === formData.confirmPassword && formData.password.length > 0;
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return false;
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements');
      return false;
    }

    if (!doPasswordsMatch) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Semi-transparent backdrop container */}
        <div className="backdrop-blur-md bg-black/90 rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div>
            <div className="mx-auto flex items-center justify-center shadow-lg">
              <div className="w-12 h-12 bg-ufc-red rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">MMA</span>
              </div>
              <span className="text-white font-bold text-3xl">Picks</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-200">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-ufc-red hover:text-red-400 transition-colors"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field mt-1 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-ufc-red focus:border-ufc-red"
                  placeholder="Choose a username"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field mt-1 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-ufc-red focus:border-ufc-red"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field pr-10 transition-colors duration-200 ${
                      formData.password.length > 0
                        ? isPasswordValid
                          ? 'bg-white/10 border-green-500/50 focus:ring-green-500 focus:border-green-500'
                          : 'bg-white/10 border-yellow-500/50 focus:ring-yellow-500 focus:border-yellow-500'
                        : 'bg-white/10 border-white/20 focus:ring-ufc-red focus:border-ufc-red'
                    } text-white placeholder-gray-300`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                </div>
                
                {/* Password Requirements */}
                <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="space-y-1">
                    {passwordRequirements.map((requirement) => {
                      const isMet = requirement.test(formData.password);
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
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-field pr-10 transition-colors duration-200 ${
                      formData.confirmPassword.length > 0
                        ? doPasswordsMatch
                          ? 'bg-white/10 border-green-500/50 focus:ring-green-500 focus:border-green-500'
                          : 'bg-white/10 border-red-500/50 focus:ring-red-500 focus:border-red-500'
                        : 'bg-white/10 border-white/20 focus:ring-ufc-red focus:border-ufc-red'
                    } text-white placeholder-gray-300`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                      doPasswordsMatch ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      {doPasswordsMatch ? (
                        <CheckIcon className="w-3 h-3 text-white" />
                      ) : (
                        <XMarkIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      doPasswordsMatch ? 'text-green-300' : 'text-gray-400'
                    }`}>
                      Passwords must match
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-ufc-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ufc-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-200">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-ufc-red hover:text-red-400 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 