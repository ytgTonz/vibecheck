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
  clipCount: number;
  lastClipAt: string | null; // most recent clip timestamp (from GET /venues)
  latestClipThumbnail: string | null;
  latestClipCaption: string | null;
  latestClipViews: number | null;
}

export interface Clip {
  id: string;
  videoUrl: string;
  thumbnail: string | null;
  duration: number;
  venueId: string;
  uploadedBy: string;
  musicGenre: string | null;
  caption: string | null;
  views: number;
  createdAt: string;
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

// ─── Admin types ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStats {
  counts: { users: number; venues: number; clips: number; feedback: number };
  usersByRole: { role: string; count: number }[];
  recentUsers: User[];
  recentVenues: AdminVenueSummary[];
  recentClips: Clip[];
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
  _count: { clips: number; promoters: number };
}

export interface AdminClip extends Clip {
  venue: { id: string; name: string };
  uploader?: { id: string; name: string; email: string } | null;
}
