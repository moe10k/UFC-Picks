import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.emailOrUsername || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(formData.emailOrUsername, formData.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
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
                <span className="text-white font-bold text-lg">UFC</span>
              </div>
              <span className="text-white font-bold text-3xl">Picks</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-200">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-ufc-red hover:text-red-400 transition-colors"
              >
                create a new account
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-200">
                  Email or Username
                </label>
                <input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  className="input-field mt-1 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-ufc-red focus:border-ufc-red"
                  placeholder="Enter your email or username"
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
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pr-10 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-ufc-red focus:border-ufc-red"
                    placeholder="Enter your password"
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
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-ufc-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ufc-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-200">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-ufc-red hover:text-red-400 transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 