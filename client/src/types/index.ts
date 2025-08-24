// Core User interface without denormalized stats
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// User statistics stored in separate table
export interface UserStats {
  id: number;
  userId: number;
  totalPicks: number;
  correctPicks: number;
  totalPoints: number;
  eventsParticipated: number;
  bestEventScore: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

// User with stats included
export interface UserWithStats extends User {
  stats: UserStats;
}

// Fighter information
export interface Fighter {
  name: string;
  nickname?: string;
  image?: string;
  record: string;
}

// Individual fight data
export interface Fight {
  id: number;
  eventId: number;
  fightNumber: number;
  weightClass: string;
  isMainCard: boolean;
  isMainEvent: boolean;
  isCoMainEvent: boolean;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Nick?: string;
  fighter2Nick?: string;
  fighter1Image?: string;
  fighter2Image?: string;
  fighter1Record?: string;
  fighter2Record?: string;
  isCompleted: boolean;
  winner?: 'fighter1' | 'fighter2' | 'draw' | 'no_contest';
  method?: 'KO/TKO' | 'Submission' | 'Decision' | 'Draw' | 'No Contest';
  round?: number;
  time?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Event without embedded fights
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
  status: 'upcoming' | 'live' | 'completed';
  isActive: boolean;
  pickDeadline: string;
  createdAt?: string;
  updatedAt?: string;
}

// Event with fights included
export interface EventWithFights extends Event {
  fights: Fight[];
}

// Individual pick prediction
export interface PickDetail {
  id: number;
  pickId: number;
  fightId: number;
  predictedWinner: 'fighter1' | 'fighter2';
  predictedMethod: 'KO/TKO' | 'Submission' | 'Decision';
  predictedRound?: number;
  predictedTime?: string;
  pointsEarned: number;
  isCorrect: boolean;
  scoredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Pick detail with fight information included
export interface PickDetailWithFight extends PickDetail {
  fight: Fight;
}

// User's picks for an event
export interface Pick {
  id: number;
  userId: number;
  eventId: number;
  isSubmitted: boolean;
  submittedAt?: string;
  isScored: boolean;
  scoredAt?: string;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  accuracy: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Pick with details included
export interface PickWithDetails extends Pick {
  pickDetails: PickDetailWithFight[];
}

// User's picks for an event with full details
export interface UserPick extends Pick {
  user: User;
  event: Event;
  pickDetails: PickDetailWithFight[];
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  user: User;
  stats: UserStats;
}

// Leaderboard response
export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  pagination: PaginationInfo;
}

// Event-specific leaderboard entry
export interface EventLeaderboardEntry {
  rank: number;
  user: User;
  stats: {
    totalPoints: number;
    correctPicks: number;
    totalPicks: number;
    accuracy: string;
  };
  submittedAt: string;
}

// Event leaderboard response
export interface EventLeaderboardResponse {
  event: {
    id: number;
    name: string;
    date: string;
    status: string;
  };
  leaderboard: EventLeaderboardEntry[];
  pagination: PaginationInfo;
}

// Authentication response
export interface AuthResponse {
  message: string;
  token: string;
  user: UserWithStats;
}

// Generic API response
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Pagination information
export interface PaginationInfo {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Events response
export interface EventsResponse {
  events: EventWithFights[];
  pagination: PaginationInfo;
}

// Picks response
export interface PicksResponse {
  picks: UserPick[];
}

// Leaderboard statistics
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

// Fight result for scoring
export interface FightResult {
  fightId: number;
  winner: 'fighter1' | 'fighter2' | 'draw' | 'no_contest';
  method: 'KO/TKO' | 'Submission' | 'Decision' | 'Draw' | 'No Contest';
  round?: number;
  time?: string;
}

// Event creation/update
export interface EventInput {
  name: string;
  date: string;
  venueName: string;
  venueCity: string;
  venueState?: string;
  venueCountry: string;
  image?: string;
  description?: string;
  pickDeadline: string;
}

// Fight creation/update
export interface FightInput {
  eventId: number;
  fightNumber: number;
  weightClass: string;
  isMainCard: boolean;
  isMainEvent: boolean;
  isCoMainEvent: boolean;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Nick?: string;
  fighter2Nick?: string;
  fighter1Image?: string;
  fighter2Image?: string;
  fighter1Record?: string;
  fighter2Record?: string;
}

// Pick submission
export interface PickSubmission {
  eventId: number;
  picks: Array<{
    fightId: number;
    predictedWinner: 'fighter1' | 'fighter2';
    predictedMethod: 'KO/TKO' | 'Submission' | 'Decision';
    predictedRound?: number;
    predictedTime?: string;
  }>;
}

// User profile update
export interface UserProfileUpdate {
  username?: string;
  email?: string;
  avatar?: string;
}

// Password change
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

// Admin event management
export interface AdminEventUpdate extends EventInput {
  status?: 'upcoming' | 'live' | 'completed';
  isActive?: boolean;
}

// Admin fight result update
export interface AdminFightResultUpdate {
  fightId: number;
  isCompleted: boolean;
  winner?: 'fighter1' | 'fighter2' | 'draw' | 'no_contest';
  method?: 'KO/TKO' | 'Submission' | 'Decision' | 'Draw' | 'No Contest';
  round?: number;
  time?: string;
  notes?: string;
}

// Search and filter options
export interface EventFilters {
  status?: 'upcoming' | 'live' | 'completed';
  dateFrom?: string;
  dateTo?: string;
  venueCity?: string;
  venueCountry?: string;
}

export interface UserFilters {
  isActive?: boolean;
  isAdmin?: boolean;
  searchTerm?: string;
}

// Database statistics
export interface DatabaseStats {
  totalUsers: number;
  totalEvents: number;
  totalFights: number;
  totalPicks: number;
  totalPickDetails: number;
  activeUsers: number;
  upcomingEvents: number;
  completedEvents: number;
} 