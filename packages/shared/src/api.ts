import {
  Venue, AuthResponse, Invite, VenuePromoter, Feedback, LiveStream,
  PaginatedResponse, AdminStats, AdminFeedback, AdminUser, AdminVenue,
  AppNotification,
  VenueIncentive, VisitIntentResponse, VisitArrivalResponse, QRTokenPreview, VisitStatsResponse,
} from './types/models';
import { FeedbackCategory, FeedbackRating } from './types/enums';

/**
 * API base URL — resolved from the active app environment by default.
 * Falls back to localhost:3001 for local development.
 */
const DEFAULT_BASE_URL = 'http://localhost:3001';

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function resolveBaseUrl() {
  const envBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    DEFAULT_BASE_URL;

  return normalizeBaseUrl(envBaseUrl);
}

function resolveClientType(): 'web' | 'mobile' | 'unknown' {
  if (process.env.NEXT_PUBLIC_CLIENT_TYPE === 'web') return 'web';
  if (process.env.EXPO_PUBLIC_CLIENT_TYPE === 'mobile') return 'mobile';
  return 'unknown';
}

let baseUrl = resolveBaseUrl();
const clientType = resolveClientType();

/** Fetch wrapper that injects the X-Client header on every request. */
function baseFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'X-Client': clientType,
      ...options.headers,
    },
  });
}

/** Optional override for tests or environments that need to swap the API server at runtime. */
export function setBaseUrl(url: string) {
  baseUrl = normalizeBaseUrl(url);
}

export function getBaseUrl(): string {
  return baseUrl;
}

/** Thin wrapper around fetch that throws on non-OK responses. */
async function apiFetch<T>(path: string): Promise<T> {
  const res = await baseFetch(`${baseUrl}${path}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `API error: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

// ─── Public venue endpoints ──────────────────────────────────────────────────

/** Fetch all venues, sorted by name. */
export function fetchVenues(): Promise<Venue[]> {
  return apiFetch<Venue[]>('/venues');
}

/** Fetch a single venue by ID. */
export function fetchVenue(id: string): Promise<Venue> {
  return apiFetch<Venue>(`/venues/${id}`);
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterAsOwnerPayload {
  accountType: 'owner';
  email: string;
  password: string;
  name: string;
  venue: {
    name: string;
    type: string;
    location: string;
    hours?: string;
    musicGenre?: string[];
  };
}

export interface RegisterAsPromoterPayload {
  accountType: 'promoter';
  email: string;
  password: string;
  name: string;
  inviteCode: string;
}

export interface RegisterAsViewerPayload {
  accountType: 'viewer';
  email: string;
  password: string;
  displayName: string;
  phone: string;
}

export type RegisterPayload = RegisterAsOwnerPayload | RegisterAsPromoterPayload | RegisterAsViewerPayload;

/** Register a new user account (owner with venue details, or promoter with invite code). */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await baseFetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Registration failed: ${res.status}`);
  }

  return body as AuthResponse;
}

/** Log in with email and password. */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await baseFetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Login failed: ${res.status}`);
  }

  return body as AuthResponse;
}

// ─── Protected venue endpoints ───────────────────────────────────────────────

/** Venue with live status, returned by fetchMyVenues(). */
export interface VenueWithStats {
  id: string;
  name: string;
  type: string;
  location: string;
  city: string;
  hours: string | null;
  musicGenre: string[];
  coverCharge: string | null;
  drinkPrices: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isLive: boolean;
  activeStreamId?: string;
  currentViewerCount: number;
}

/** Fetch venues the current user owns or is a promoter for, with stats. */
export async function fetchMyVenues(token: string): Promise<VenueWithStats[]> {
  const res = await baseFetch(`${baseUrl}/venues/my/venues`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to fetch venues: ${res.status}`);
  }

  return body as VenueWithStats[];
}

/** Update venue details (owner only). */
export async function updateVenue(
  venueId: string,
  data: Partial<Pick<Venue, 'name' | 'type' | 'location' | 'hours' | 'musicGenre' | 'coverCharge' | 'drinkPrices'>>,
  token: string
): Promise<Venue> {
  const res = await baseFetch(`${baseUrl}/venues/${venueId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to update venue: ${res.status}`);
  }

  return body as Venue;
}

/** Payload for creating a new venue. */
export interface CreateVenuePayload {
  name: string;
  type: string;
  location: string;
  hours?: string;
  musicGenre?: string[];
  coverCharge?: string;
  drinkPrices?: string;
}

/** Create a new venue (venue owner only). */
export async function createVenue(
  data: CreateVenuePayload,
  token: string
): Promise<Venue> {
  const res = await baseFetch(`${baseUrl}/venues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to create venue: ${res.status}`);
  }

  return body as Venue;
}

// ─── Invite & promoter management ───────────────────────────────────────────

/** Generate an invite code for a venue (owner only). */
export async function generateInvite(
  venueId: string,
  token: string
): Promise<Invite> {
  const res = await baseFetch(`${baseUrl}/venues/${venueId}/invite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to generate invite: ${res.status}`);
  }

  return body as Invite;
}

/** Fetch promoters linked to a venue (owner only). */
export async function fetchVenuePromoters(
  venueId: string,
  token: string
): Promise<VenuePromoter[]> {
  const res = await baseFetch(`${baseUrl}/venues/${venueId}/promoters`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to fetch promoters: ${res.status}`);
  }

  return body as VenuePromoter[];
}

/** Remove a promoter from a venue (owner only). */
export async function removePromoter(
  venueId: string,
  userId: string,
  token: string
): Promise<void> {
  const res = await baseFetch(`${baseUrl}/venues/${venueId}/promoters/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to remove promoter: ${res.status}`);
  }
}

// ─── Live streaming ─────────────────────────────────────────────────────────

/** Create a new stream for a venue. */
export async function createStream(
  venueId: string,
  token: string,
): Promise<LiveStream> {
  const res = await baseFetch(`${baseUrl}/streams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ venueId }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to create stream: ${res.status}`);
  }

  return body as LiveStream;
}

/** Fetch all currently LIVE streams. */
export function fetchActiveStreams(): Promise<LiveStream[]> {
  return apiFetch<LiveStream[]>('/streams/active');
}

/** Fetch a single stream by ID. */
export function fetchStream(streamId: string): Promise<LiveStream> {
  return apiFetch<LiveStream>(`/streams/${streamId}`);
}

/** Fetch broadcaster token for a stream. */
export async function fetchStreamToken(
  streamId: string,
  token: string,
): Promise<{ token: string }> {
  const res = await baseFetch(`${baseUrl}/streams/${streamId}/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to fetch stream token: ${res.status}`);
  }

  return body as { token: string };
}

/** Fetch anonymous viewer token for a stream. */
export function fetchViewerToken(
  streamId: string,
): Promise<{ token: string }> {
  return apiFetch<{ token: string }>(`/streams/${streamId}/viewer-token`);
}

/** End a stream. */
export async function endStream(
  streamId: string,
  token: string,
  viewerPeak?: number,
): Promise<LiveStream> {
  const res = await baseFetch(`${baseUrl}/streams/${streamId}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ viewerPeak }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to end stream: ${res.status}`);
  }

  return res.json() as Promise<LiveStream>;
}

/** Signal that the broadcaster's media track is published — transitions IDLE → LIVE. */
export async function goLiveStream(
  streamId: string,
  token: string,
): Promise<LiveStream> {
  const res = await baseFetch(`${baseUrl}/streams/${streamId}/go-live`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to go live: ${res.status}`);
  }

  return body as LiveStream;
}

/** Fetch recent ended streams for a venue. */
export function fetchVenueRecentStreams(venueId: string): Promise<LiveStream[]> {
  return apiFetch<LiveStream[]>(`/streams/venue/${venueId}/recent`);
}

/** Admin: force-end all active (IDLE/LIVE) streams. */
export async function endAllStreams(token: string): Promise<{ ended: number }> {
  const res = await baseFetch(`${baseUrl}/streams/end-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to end streams: ${res.status}`);
  return body as { ended: number };
}

// ─── Notifications ──────────────────────────────────────────────────────────

/** Register a mobile push token. Auth token is optional — if omitted the token is stored anonymously and still receives broadcast notifications (e.g. venue go-live). */
export async function registerPushToken(
  pushToken: string,
  platform: string,
  authToken?: string,
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await baseFetch(`${baseUrl}/notifications/push-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token: pushToken, platform }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to register push token: ${res.status}`);
  }
}

/** Unregister a push token (on logout). */
export async function unregisterPushToken(
  pushToken: string,
  authToken: string,
): Promise<void> {
  const res = await baseFetch(`${baseUrl}/notifications/push-token`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token: pushToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to unregister push token: ${res.status}`);
  }
}

/** Fetch notifications for the current user. */
export async function fetchNotifications(
  authToken: string,
  filters?: { unreadOnly?: boolean; page?: number },
): Promise<{ data: AppNotification[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (filters?.unreadOnly) params.set('unreadOnly', 'true');
  if (filters?.page) params.set('page', String(filters.page));
  const qs = params.toString();

  const res = await baseFetch(`${baseUrl}/notifications${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to fetch notifications: ${res.status}`);
  return body;
}

/** Mark a notification as read. */
export async function markNotificationRead(
  id: string,
  authToken: string,
): Promise<void> {
  const res = await baseFetch(`${baseUrl}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to mark notification: ${res.status}`);
  }
}

// ─── Feedback ───────────────────────────────────────────────────────────────

/** Submit user feedback. */
export async function submitFeedback(
  data: { category: FeedbackCategory; rating: FeedbackRating; message?: string },
  token: string
): Promise<Feedback> {
  const res = await baseFetch(`${baseUrl}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to submit feedback: ${res.status}`);
  }

  return body as Feedback;
}

// ─── Admin endpoints ────────────────────────────────────────────────────────

/** Fetch platform-wide admin stats. */
export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await baseFetch(`${baseUrl}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to fetch admin stats: ${res.status}`);
  return body as AdminStats;
}

/** Fetch paginated feedback with optional filters. */
export async function fetchAdminFeedback(
  token: string,
  filters?: { category?: string; rating?: string; query?: string; page?: number; limit?: number }
): Promise<PaginatedResponse<AdminFeedback>> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.rating) params.set('rating', filters.rating);
  if (filters?.query) params.set('query', filters.query);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();

  const res = await baseFetch(`${baseUrl}/admin/feedback${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to fetch feedback: ${res.status}`);
  return body as PaginatedResponse<AdminFeedback>;
}

/** Fetch paginated users with counts. */
export async function fetchAdminUsers(
  token: string,
  filters?: { page?: number; query?: string; role?: string }
): Promise<PaginatedResponse<AdminUser>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.query) params.set('query', filters.query);
  if (filters?.role) params.set('role', filters.role);
  const qs = params.toString();
  const res = await baseFetch(`${baseUrl}/admin/users${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to fetch users: ${res.status}`);
  return body as PaginatedResponse<AdminUser>;
}

/** Delete a user by ID (admin only). */
export async function deleteAdminUser(id: string, token: string): Promise<void> {
  const res = await baseFetch(`${baseUrl}/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to delete user: ${res.status}`);
  }
}

/** Fetch paginated venues with owner info and counts. */
export async function fetchAdminVenues(
  token: string,
  filters?: { page?: number; query?: string; type?: string }
): Promise<PaginatedResponse<AdminVenue>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.query) params.set('query', filters.query);
  if (filters?.type) params.set('type', filters.type);
  const qs = params.toString();
  const res = await baseFetch(`${baseUrl}/admin/venues${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to fetch venues: ${res.status}`);
  return body as PaginatedResponse<AdminVenue>;
}

/** Delete a venue by ID (admin only). */
export async function deleteAdminVenue(id: string, token: string): Promise<void> {
  const res = await baseFetch(`${baseUrl}/admin/venues/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to delete venue: ${res.status}`);
  }
}

// ─── Attendance tracking ─────────────────────────────────────────────────────

export interface AttendanceResponse {
  intentCount: number;
  arrivalCount: number;
  alreadyPressed: boolean;
}

/** Fetch current intent + arrival counts for a stream. */
export function fetchAttendanceCounts(
  streamId: string,
): Promise<{ intentCount: number; arrivalCount: number }> {
  return apiFetch<{ intentCount: number; arrivalCount: number }>(`/attendance/${streamId}/counts`);
}

/** Record "I'm Coming" intent for a stream. */
export async function recordAttendanceIntent(
  streamId: string,
  deviceId: string,
  token?: string,
): Promise<AttendanceResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await baseFetch(`${baseUrl}/attendance/intent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ streamId, deviceId }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to record intent: ${res.status}`);
  return body as AttendanceResponse;
}

/** Record "I'm Here" arrival for a stream. */
export async function recordAttendanceArrival(
  streamId: string,
  deviceId: string,
  token?: string,
): Promise<AttendanceResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await baseFetch(`${baseUrl}/attendance/arrival`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ streamId, deviceId }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to record arrival: ${res.status}`);
  return body as AttendanceResponse;
}

// ─── Viewer auth verification ─────────────────────────────────────────────────

/** Verify a viewer's email via the token from the verification link. */
export async function verifyEmail(
  token: string,
): Promise<{ message: string; user: AuthResponse['user'] }> {
  const res = await baseFetch(`${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Email verification failed: ${res.status}`);
  return body;
}

/** Verify a viewer's phone number with the OTP code. Requires auth token. */
export async function verifyPhone(
  otp: string,
  authToken: string,
): Promise<{ message: string; user: AuthResponse['user'] }> {
  const res = await baseFetch(`${baseUrl}/auth/verify-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ otp }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Phone verification failed: ${res.status}`);
  return body;
}

// ─── Venue visits ─────────────────────────────────────────────────────────────

/** Record "I'm Coming" intent for a venue visit. Idempotent. */
export async function recordVisitIntent(
  payload: { venueId: string; streamId?: string },
  authToken: string,
): Promise<VisitIntentResponse> {
  const res = await baseFetch(`${baseUrl}/visits/intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to record visit intent: ${res.status}`);
  return body as VisitIntentResponse;
}

/** Record "I'm Here" arrival and generate a QR token. Requires both email + phone verified. */
export async function recordVisitArrival(
  payload: { venueId: string; streamId?: string },
  authToken: string,
): Promise<VisitArrivalResponse> {
  const res = await baseFetch(`${baseUrl}/visits/arrival`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to record visit arrival: ${res.status}`);
  return body as VisitArrivalResponse;
}

/** Preview a QR token (public — no auth required). */
export async function fetchQRToken(token: string): Promise<QRTokenPreview> {
  const res = await baseFetch(`${baseUrl}/visits/qr/${encodeURIComponent(token)}`);
  const body = await res.json();
  if (res.status === 410) return body as QRTokenPreview;
  if (!res.ok) throw new Error(body.error || `Failed to fetch QR token: ${res.status}`);
  return body as QRTokenPreview;
}

/** Redeem a QR token (venue staff only). Single-use. */
export async function redeemQRToken(
  token: string,
  authToken: string,
): Promise<{ message: string; incentive: { title: string; description: string } | null; claimedAt: string }> {
  const res = await baseFetch(`${baseUrl}/visits/qr/${encodeURIComponent(token)}/redeem`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || body.reason || `Failed to redeem QR token: ${res.status}`);
  return body;
}

/** Fetch visit stats (coming / arrived / claimed) for a venue. */
export async function fetchVenueVisitStats(
  venueId: string,
  authToken: string,
): Promise<VisitStatsResponse> {
  const res = await baseFetch(`${baseUrl}/venues/${venueId}/visit-stats`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to fetch visit stats: ${res.status}`);
  return body as VisitStatsResponse;
}

// ─── Incentive management ─────────────────────────────────────────────────────

/** Fetch the active incentive for a venue (public). Returns null if none. */
export async function fetchActiveIncentive(venueId: string): Promise<VenueIncentive | null> {
  const res = await baseFetch(`${baseUrl}/venues/${venueId}/incentive`);
  if (res.status === 404) return null;
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to fetch incentive: ${res.status}`);
  return body as VenueIncentive;
}

/** Create a new active incentive for a venue (owner only). Deactivates any existing one. */
export async function createIncentive(
  payload: { venueId: string; title: string; description: string; expiresAt?: string },
  authToken: string,
): Promise<VenueIncentive> {
  const res = await baseFetch(`${baseUrl}/incentives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to create incentive: ${res.status}`);
  return body as VenueIncentive;
}

/** Update an existing incentive (owner only). */
export async function updateIncentive(
  id: string,
  data: Partial<{ title: string; description: string; expiresAt: string | null; active: boolean }>,
  authToken: string,
): Promise<VenueIncentive> {
  const res = await baseFetch(`${baseUrl}/incentives/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Failed to update incentive: ${res.status}`);
  return body as VenueIncentive;
}
