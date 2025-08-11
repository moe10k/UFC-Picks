export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  stats: UserStats;
  isAdmin?: boolean;
  isOwner?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface UserStats {
  totalPicks: number;
  correctPicks: number;
  totalPoints: number;
  eventsParticipated: number;
  bestEventScore: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Fighter {
  name: string;
  nickname?: string;
  image?: string;
  record: {
    wins: number;
    losses: number;
    draws: number;
  };
  stats?: {
    age?: number;
    height?: string;
    weight?: string;
    reach?: string;
    stance?: string;
    hometown?: string;
  };
}

export interface Fight {
  fightNumber: number;
  weightClass: string;
  isMainCard: boolean;
  isMainEvent: boolean;
  isCoMainEvent: boolean;
  fighter1: Fighter;
  fighter2: Fighter;
  result?: {
    winner?: 'fighter1' | 'fighter2';
    method?: 'KO/TKO' | 'Submission' | 'Decision';
    round?: number;
    time?: string;
  };
  isCompleted: boolean;
}

export interface Event {
  id: number;
  name: string;
  date: string;
  venue: {
    name: string;
    city: string;
    state?: string;
    country: string;
  };
  image?: string;
  description?: string;
  fights: Fight[];
  status: 'upcoming' | 'live' | 'completed';
  isActive: boolean;
  pickDeadline: string;
  mainCardFights?: Fight[];
  isUpcoming?: boolean;
  formattedDate?: string;
}

export interface Pick {
  fightNumber: number;
  winner: 'fighter1' | 'fighter2';
  method: 'KO/TKO' | 'Submission' | 'Decision';
  round?: number; // Optional for Decision method
  time?: string; // Optional time prediction for KO/TKO and Submission methods
}

export interface UserPick {
  id: number;
  user: string | {
    id: number;
    username: string;
    avatar?: string;
  };
  event: string | Event;
  picks: Pick[];
  totalPoints: number;
  correctPicks: number;
  isSubmitted: boolean;
  submittedAt?: string;
  isScored: boolean;
  scoredAt?: string;
  accuracy?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  stats: {
    totalPoints: number;
    totalPicks: number;
    correctPicks: number;
    accuracy: string;
    eventsParticipated: number;
    bestEventScore: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface EventLeaderboardResponse {
  event: {
    id: number;
    name: string;
    date: string;
    status: string;
  };
  leaderboard: Array<{
    rank: number;
    user: {
      id: number;
      username: string;
      avatar?: string;
    };
    stats: {
      totalPoints: number;
      correctPicks: number;
      totalPicks: number;
      accuracy: string;
    };
    submittedAt: string;
  }>;
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationInfo {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EventsResponse {
  events: Event[];
  pagination: PaginationInfo;
}

export interface PicksResponse {
  picks: UserPick[];
}

export interface LeaderboardStats {
  totalUsers: number;
  totalEvents: number;
  totalPicks: number;
  avgPoints: number;
  topUsers: Array<{
    rank: number;
    username: string;
    totalPoints: number;
    avatar?: string;
  }>;
} 