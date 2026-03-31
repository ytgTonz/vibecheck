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
  intentCount?: number;
  arrivalCount?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  /** Stub only — present on viewer registration, remove when real SMS provider is wired */
  otpDebug?: { phoneOtp: string };
  /** Stub only — present on viewer registration, remove when real email provider is wired */
  verificationLinks?: { emailVerifyUrl: string };
}

// ─── Venue visit / QR check-in types ─────────────────────────────────────────

export interface VenueIncentive {
  id: string;
  venueId: string;
  title: string;
  description: string;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface VenueVisit {
  id: string;
  userId: string;
  venueId: string;
  streamId: string | null;
  intentAt: string | null;
  arrivedAt: string | null;
  incentiveId: string | null;
  createdAt: string;
}

export interface VisitIntentResponse {
  visitId: string;
  intentAt: string | null;
  alreadyRecorded: boolean;
}

export interface VisitArrivalResponse {
  visitId: string;
  qrToken: string;
  expiresAt: string;
  incentive: { title: string; description: string } | null;
}

export interface QRTokenPreview {
  valid: boolean;
  reason?: 'already_used' | 'expired';
  venueId?: string;
  venueName?: string;
  expiresAt?: string;
  used?: boolean;
  claimedAt?: string;
  incentive: { title: string; description: string } | null;
}

export interface VisitStatsResponse {
  venueId: string;
  comingCount: number;
  arrivedCount: number;
  claimedCount: number;
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
  /** Attendance funnel — populated by the recent-streams endpoint */
  intentCount?: number;
  arrivalCount?: number;
}

// ─── Notification types ─────────────────────────────────────────────────────

export type NotificationType =
  | 'STREAM_LIVE'
  | 'STREAM_ENDED'
  | 'VENUE_CREATED'
  | 'USER_REGISTERED'
  | 'ATTENDANCE_INTENT';

export interface AttendanceCounts {
  intentCount: number;
  arrivalCount: number;
  alreadyPressed?: boolean;
}

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
