import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  UsersIcon, 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  ownerUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentUsers: number;
  adminPercentage: string;
}

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'user' | 'owner' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'status';
    userId: number;
    username: string;
    newValue: boolean;
    currentValue: boolean;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { users, pagination } = await authAPI.getUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        role: roleFilter
      });
      setUsers(users);
      setTotalPages(pagination.total);
      setTotalUsers(pagination.totalUsers);
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { stats } = await authAPI.getUserStats();
      setStats(stats);
    } catch (error: any) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleRoleToggle = (user: User) => {
    // Prevent modifying owner accounts unless current user is also owner
    if (user.isOwner && !currentUser?.isOwner) {
      toast.error('Only the owner can modify owner accounts');
      return;
    }

    // Prevent modifying own account
    if (user.id === currentUser?.id) {
      toast.error('You cannot modify your own admin privileges');
      return;
    }

    setConfirmAction({
      type: 'role',
      userId: user.id,
      username: user.username,
      newValue: !user.isAdmin,
      currentValue: user.isAdmin || false
    });
    setShowConfirmDialog(true);
  };

  const handleStatusToggle = (user: User) => {
    // Prevent deactivating owner accounts
    if (user.isOwner) {
      toast.error('Owner accounts cannot be deactivated');
      return;
    }

    // Prevent modifying own account
    if (user.id === currentUser?.id) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    setConfirmAction({
      type: 'status',
      userId: user.id,
      username: user.username,
      newValue: !user.isActive,
      currentValue: user.isActive || false
    });
    setShowConfirmDialog(true);
  };

  const confirmActionHandler = async () => {
    if (!confirmAction) return;

    try {
      setIsUpdating(true);
      
      if (confirmAction.type === 'role') {
        await authAPI.updateUserRole(confirmAction.userId, confirmAction.newValue);
        toast.success(`Successfully ${confirmAction.newValue ? 'granted' : 'revoked'} admin privileges for ${confirmAction.username}`);
      } else {
        await authAPI.updateUserStatus(confirmAction.userId, confirmAction.newValue);
        toast.success(`Successfully ${confirmAction.newValue ? 'activated' : 'deactivated'} account for ${confirmAction.username}`);
      }

      // Refresh data
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: 'admin' | 'user' | 'owner' | '') => {
    setRoleFilter(filter);
    setCurrentPage(1);
  };

  const getRoleDisplay = (user: User) => {
    if (user.isOwner) {
      return {
        label: 'Owner',
        icon: StarIcon,
        className: 'bg-purple-900 text-purple-200'
      };
    } else if (user.isAdmin) {
      return {
        label: 'Admin',
        icon: ShieldCheckIcon,
        className: 'bg-yellow-900 text-yellow-200'
      };
    } else {
      return {
        label: 'User',
        icon: UserIcon,
        className: 'bg-gray-700 text-gray-300'
      };
    }
  };

  if (!currentUser?.isAdmin && !currentUser?.isOwner) {
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
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
            <UsersIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            User Management
          </h1>
        </div>
        <p className="text-gray-400 text-lg">
          Manage user accounts and administrator privileges
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center bg-gradient-to-br from-blue-600 to-blue-700">
            <div className="flex items-center justify-center mb-3">
              <UsersIcon className="w-8 h-8 text-blue-200" />
            </div>
            <h3 className="text-lg font-semibold text-blue-100 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          
          <div className="card text-center bg-gradient-to-br from-purple-600 to-purple-700">
            <div className="flex items-center justify-center mb-3">
              <StarIcon className="w-8 h-8 text-purple-200" />
            </div>
            <h3 className="text-lg font-semibold text-purple-100 mb-2">Owners</h3>
            <p className="text-3xl font-bold text-white">{stats.ownerUsers}</p>
          </div>
          
          <div className="card text-center bg-gradient-to-br from-green-600 to-green-700">
            <div className="flex items-center justify-center mb-3">
              <ShieldCheckIcon className="w-8 h-8 text-green-200" />
            </div>
            <h3 className="text-lg font-semibold text-green-100 mb-2">Admins</h3>
            <p className="text-3xl font-bold text-white">{stats.adminUsers}</p>
            <p className="text-sm text-green-200">{stats.adminPercentage}%</p>
          </div>
          
          <div className="card text-center bg-gradient-to-br from-yellow-600 to-yellow-700">
            <div className="flex items-center justify-center mb-3">
              <UserIcon className="w-8 h-8 text-yellow-200" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-100 mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ufc-gold focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange(e.target.value as 'admin' | 'user' | 'owner' | '')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ufc-gold focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="owner">Owners Only</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">User</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Email</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Role</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Joined</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleDisplay = getRoleDisplay(user);
                const RoleIcon = roleDisplay.icon;
                
                return (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full mr-3 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{user.username}</div>
                          <div className="text-sm text-gray-400">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleDisplay.className}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {roleDisplay.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {user.isActive ? (
                          <>
                            <EyeIcon className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeSlashIcon className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRoleToggle(user)}
                          disabled={
                            user.id === currentUser?.id || 
                            isUpdating || 
                            (user.isOwner && !currentUser?.isOwner)
                          }
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            user.id === currentUser?.id || (user.isOwner && !currentUser?.isOwner)
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : user.isAdmin
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user)}
                          disabled={
                            user.id === currentUser?.id || 
                            isUpdating || 
                            user.isOwner
                          }
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            user.id === currentUser?.id || user.isOwner
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : user.isActive
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:bg-gray-600 disabled:text-gray-400 hover:bg-gray-600 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:bg-gray-600 disabled:text-gray-400 hover:bg-gray-600 transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-8">
            <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400 mr-3" />
              <h3 className="text-xl font-bold text-white">Confirm Action</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to{' '}
              {confirmAction.type === 'role' 
                ? `${confirmAction.newValue ? 'grant' : 'revoke'} administrator privileges`
                : `${confirmAction.newValue ? 'activate' : 'deactivate'} the account`
              } for <span className="font-semibold text-white">{confirmAction.username}</span>?
            </p>

            {confirmAction.type === 'role' && !confirmAction.newValue && (
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 mb-4">
                <p className="text-yellow-200 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                  Warning: This will remove all administrator privileges from this user.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionHandler}
                disabled={isUpdating}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  confirmAction.type === 'role'
                    ? confirmAction.newValue
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                    : confirmAction.newValue
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {isUpdating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
