import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  TrophyIcon, 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
    { name: 'My Picks', href: '/my-picks', icon: UserIcon },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-ufc-gray border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-ufc-red rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">UFC</span>
              </div>
              <span className="text-white font-bold text-xl">Picks</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-ufc-red text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  @{user?.username}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <div className="w-8 h-8 bg-ufc-red rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to="/profile"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1" />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-md"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-ufc-gray border-t border-gray-700">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-ufc-red text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex items-center px-3 py-2">
                <div className="w-8 h-8 bg-ufc-red rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    @{user?.username}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserIcon className="w-5 h-5 mr-3" />
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-gray-300 hover:text-white rounded-md text-base font-medium"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 