import axios from 'axios';
import { 
  User, 
  UserStats,
  Event, 
  UserPick, 
  Pick, 
  LeaderboardResponse, 
  EventLeaderboardResponse,
  AuthResponse,
  EventsResponse,
  PicksResponse,
  LeaderboardStats,
  EventWithFights,
  UserWithStats
} from '../types';

// In production, use the same origin (relative URL) since the API is served from the same server
// In development, use the localhost server
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { emailOrUsername: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<{ user: UserWithStats }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: {
    avatar?: string;
  }): Promise<AuthResponse> => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<AuthResponse> => {
    const form = new FormData();
    form.append('avatar', file);
    const response = await api.post('/auth/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Admin user management
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'admin' | 'user' | 'owner' | '';
  }): Promise<{
    users: User[];
    pagination: {
      current: number;
      total: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const response = await api.get('/auth/users', { params });
    return response.data;
  },

  updateUserRole: async (userId: number, isAdmin: boolean): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await api.put(`/auth/users/${userId}/role`, { isAdmin });
    return response.data;
  },

  updateUserStatus: async (userId: number, isActive: boolean): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await api.put(`/auth/users/${userId}/status`, { isActive });
    return response.data;
  },

  getUserStats: async (): Promise<{
    stats: {
      totalUsers: number;
      adminUsers: number;
      ownerUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      recentUsers: number;
      adminPercentage: string;
    };
  }> => {
    const response = await api.get('/auth/users/stats');
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  getAll: async (params?: {
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<EventsResponse> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getUpcoming: async (): Promise<{ event: EventWithFights }> => {
    const response = await api.get('/events/upcoming');
    return response.data;
  },

  getById: async (id: string | number): Promise<{ event: EventWithFights }> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData: any): Promise<{ message: string; event: Event }> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  update: async (id: string | number, eventData: any): Promise<{ message: string; event: Event }> => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  updateResults: async (id: string | number, fightResults: any[]): Promise<{ message: string; event: Event }> => {
    const response = await api.put(`/events/${id}/results`, { fightResults });
    return response.data;
  },

  delete: async (id: string, hardDelete: boolean = true): Promise<{ message: string }> => {
    const response = await api.delete(`/events/${id}?hardDelete=${hardDelete}`);
    return response.data;
  },

  forceCleanup: async (): Promise<{ message: string; picksDeleted: number; eventsDeleted: number; totalCleaned: number }> => {
    const response = await api.post('/events/force-cleanup-all');
    return response.data;
  },

  getDeleted: async (): Promise<{ deletedEvents: any[]; total: number }> => {
    const response = await api.get('/events/deleted');
    return response.data;
  },

  restore: async (id: string): Promise<{ message: string; event: any }> => {
    const response = await api.post(`/events/${id}/restore`);
    return response.data;
  },

  getOrphanedPicks: async (action?: 'report' | 'delete'): Promise<{ message: string; totalOrphaned: number; report?: any[]; picksDeleted?: number }> => {
    const response = await api.post(`/events/cleanup-orphaned-picks?action=${action || 'report'}`);
    return response.data;
  },

  cleanupOrphanedPicks: async (): Promise<{ message: string; picksDeleted: number; totalOrphaned: number }> => {
    const response = await api.post('/events/cleanup-orphaned-picks?action=delete');
    return response.data;
  },

  checkOrphanedPicks: async (): Promise<{ message: string; totalOrphaned: number; report: any[] }> => {
    const response = await api.post('/events/cleanup-orphaned-picks?action=report');
    return response.data;
  },
};

// Picks API
export const picksAPI = {
  submit: async (pickData: { eventId: string | number; picks: Pick[] }): Promise<{ message: string; pick: UserPick }> => {
    const response = await api.post('/picks', pickData);
    return response.data;
  },

  getUserPicks: async (userId: string | number, eventId?: string | number): Promise<PicksResponse> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get(`/picks/user/${userId}`, { params });
    return response.data;
  },

  getMyPicks: async (eventId?: string | number): Promise<PicksResponse> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/picks/my-picks', { params });
    return response.data;
  },

  getEventPicks: async (eventId: string | number): Promise<PicksResponse> => {
    const response = await api.get(`/picks/event/${eventId}`);
    return response.data;
  },

  update: async (pickId: string | number, picks: Pick[]): Promise<{ message: string; pick: UserPick }> => {
    const response = await api.put(`/picks/${pickId}`, { picks });
    return response.data;
  },
};

// Leaderboard API
export const leaderboardAPI = {
  getGlobal: async (params?: { limit?: number; page?: number }): Promise<LeaderboardResponse> => {
    const response = await api.get('/leaderboard', { params });
    return response.data;
  },

  getEvent: async (eventId: string | number, params?: { limit?: number; page?: number }): Promise<EventLeaderboardResponse> => {
    const response = await api.get(`/leaderboard/event/${eventId}`, { params });
    return response.data;
  },

  getUserRanking: async (userId: string | number): Promise<{
    user: User;
    stats: UserStats;
    rankings: {
      global: number;
      events: number;
    };
    recentPicks: UserPick[];
  }> => {
    const response = await api.get(`/leaderboard/user/${userId}`);
    return response.data;
  },

  getStats: async (): Promise<LeaderboardStats> => {
    const response = await api.get('/leaderboard/stats');
    return response.data;
  },
};

export default api; 