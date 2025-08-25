import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  TrophyIcon, 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  PlusIcon,
  ChevronDownIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isAdminDropdownOpen || isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAdminDropdownOpen, isUserDropdownOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'My Picks', href: '/my-picks', icon: UserIcon },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
    { name: 'Wager', href: '/wager', icon: CurrencyDollarIcon, comingSoon: true },
    { name: 'Store', href: '/store', icon: ShoppingBagIcon, comingSoon: true },
  ];

  const adminOptions = [
    { name: 'Dashboard', href: '/admin', icon: Cog6ToothIcon },
    { name: 'Create Event', href: '/admin/events/create', icon: PlusIcon },
    { name: 'Manage Events', href: '/admin/events', icon: CalendarIcon },

    { name: 'User Management', href: '/admin/users', icon: UserIcon },
  ];

  const userOptions = [
    { name: 'View Profile', href: '/profile', icon: EyeIcon },
    { name: 'Security Settings', href: '/security', icon: ShieldCheckIcon },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-ufc-gray border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4">
        <div className="flex justify-between h-16">
          {/* Logo - Moved more to the left */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-ufc-red rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">MMA</span>
              </div>
              <span className="text-white font-bold text-xl">Picks</span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered with more space */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isComingSoon = item.comingSoon;
              
              if (isComingSoon) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed opacity-60 whitespace-nowrap"
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                    <span className="ml-2 px-2 py-0.5 bg-gray-600 text-xs font-semibold rounded-full whitespace-nowrap">
                      Coming Soon
                    </span>
                  </div>
                );
              }
              
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
            
            {/* Admin Dropdown */}
            {(user?.isAdmin || user?.isOwner) && (
              <div className="relative" ref={adminDropdownRef}>
                <button
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-yellow-600 text-white'
                      : 'text-yellow-300 hover:text-yellow-200 hover:bg-yellow-700'
                  }`}
                >
                  <Cog6ToothIcon className="w-5 h-5 mr-2" />
                  Admin
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                </button>
                
                {isAdminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-600">
                    {adminOptions.map((option) => {
                      // More precise active state logic to avoid conflicts
                      let isActive = false;
                      if (option.href === '/admin') {
                        // Dashboard is active only when exactly on /admin
                        isActive = location.pathname === '/admin';
                      } else if (option.href === '/admin/events') {
                        // Manage Events is active only when exactly on /admin/events (not on create/edit pages)
                        isActive = location.pathname === '/admin/events';
                      } else {
                        // Other options use exact match or specific prefix matching
                        isActive = location.pathname === option.href || 
                          (option.href !== '/admin' && 
                           location.pathname.startsWith(option.href) && 
                           !location.pathname.includes('/create') && 
                           !location.pathname.includes('/edit'));
                      }
                      
                      return (
                        <Link
                          key={option.name}
                          to={option.href}
                          className={`flex items-center px-4 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-yellow-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                          onClick={() => setIsAdminDropdownOpen(false)}
                        >
                          <option.icon className="w-4 h-4 mr-3" />
                          {option.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu - Moved more to the right */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    @{user?.username}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <div className="w-8 h-8 bg-ufc-red rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`@${user.username}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>
              
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-600">
                  {userOptions.map((option) => {
                    const isActive = location.pathname === option.href;
                    return (
                      <Link
                        key={option.name}
                        to={option.href}
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-ufc-red text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <option.icon className="w-4 h-4 mr-3" />
                        {option.name}
                      </Link>
                    );
                  })}
                  <div className="border-t border-gray-600 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsUserDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
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
              const isComingSoon = item.comingSoon;
              
              if (isComingSoon) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-400 cursor-not-allowed opacity-60"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    <span className="ml-2 px-2 py-0.5 bg-gray-600 text-xs font-semibold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                );
              }
              
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
            
            {/* Admin Navigation Mobile */}
            {(user?.isAdmin || user?.isOwner) && (
              <>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <p className="px-3 py-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                    Admin
                  </p>
                </div>
                {adminOptions.map((option) => {
                  // More precise active state logic to avoid conflicts (same as desktop)
                  let isActive = false;
                  if (option.href === '/admin') {
                    // Dashboard is active only when exactly on /admin
                    isActive = location.pathname === '/admin';
                  } else if (option.href === '/admin/events') {
                    // Manage Events is active only when exactly on /admin/events (not on create/edit pages)
                    isActive = location.pathname === '/admin/events';
                  } else {
                    // Other options use exact match or specific prefix matching
                    isActive = location.pathname === option.href || 
                      (option.href !== '/admin' && 
                       location.pathname.startsWith(option.href) && 
                       !location.pathname.includes('/create') && 
                       !location.pathname.includes('/edit'));
                  }
                  
                  return (
                    <Link
                      key={option.name}
                      to={option.href}
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-yellow-600 text-white'
                          : 'text-yellow-300 hover:text-yellow-200 hover:bg-yellow-700'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <option.icon className="w-5 h-5 mr-3" />
                      {option.name}
                    </Link>
                  );
                })}
              </>
            )}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex items-center px-3 py-2">
                <div className="w-8 h-8 bg-ufc-red rounded-full flex items-center justify-center mr-3">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`@${user.username}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
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