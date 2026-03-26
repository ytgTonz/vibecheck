import { VenueType, UserRole, FeedbackCategory, FeedbackRating } from './enums';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  location: string;
  city: string;
  hours: string | null;
  musicGenre: string[];
  coverCharge: string | null;
  drinkPrices: string | null;
  ownerId: string;
  createdAt: string; // ISO date string (JSON serialised from Date)
  updatedAt: string;
  isLive?: boolean;
  activeStreamId?: string;
  vibeScore?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VenuePromoter {
  id: string;
  userId: string;
  venueId: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface Invite {
  id: string;
  code: string;
  venueId: string;
  createdBy: string;
  used: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  category: FeedbackCategory;
  rating: FeedbackRating;
  message: string | null;
  userId: string;
  createdAt: string;
}

// ─── Live streaming types ───────────────────────────────────────────────────

export interface LiveStream {
  id: string;
  venueId: string;
  livekitRoom: string;
  status: 'IDLE' | 'LIVE' | 'ENDED';
  startedAt: string | null;
  endedAt: string | null;
  currentViewerCount: number;
  viewerPeak: number;
  createdBy: string;
  createdAt: string;
  venue?: { id: string; name: string; type: string; location: string };
}

// ─── Notification types ─────────────────────────────────────────────────────

export type NotificationType = 'STREAM_LIVE' | 'STREAM_ENDED' | 'VENUE_CREATED' | 'USER_REGISTERED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  userId: string | null;
  read: boolean;
  createdAt: string;
}

// ─── Admin types ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStats {
  counts: { users: number; venues: number; feedback: number; activeStreams: number };
  usersByRole: { role: string; count: number }[];
  recentUsers: User[];
  recentVenues: AdminVenueSummary[];
}

export interface AdminVenueSummary {
  id: string;
  name: string;
  type: VenueType;
  location: string;
  city: string;
  hours: string | null;
  musicGenre: string[];
  coverCharge: string | null;
  drinkPrices: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeedback extends Feedback {
  user: { id: string; name: string; email: string };
}

export interface AdminUser extends User {
  _count: { ownedVenues: number; venueLinks: number; feedback: number };
}

export interface AdminVenue extends AdminVenueSummary {
  owner: { id: string; name: string; email: string };
  _count: { promoters: number };
}
