import { Venue, Clip, AuthResponse } from './types';

/**
 * API base URL — set once at app startup via setBaseUrl().
 * Defaults to localhost:3001 for local development.
 */
let baseUrl = 'http://localhost:3001';

/** Call this once when your app loads to point at the right API server. */
export function setBaseUrl(url: string) {
  // Strip trailing slash so we can always append /path
  baseUrl = url.replace(/\/+$/, '');
}

export function getBaseUrl(): string {
  return baseUrl;
}

/** Thin wrapper around fetch that throws on non-OK responses. */
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `API error: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

/** Fetch all venues, sorted by name. */
export function fetchVenues(): Promise<Venue[]> {
  return apiFetch<Venue[]>('/venues');
}

/** Fetch a single venue by ID. */
export function fetchVenue(id: string): Promise<Venue> {
  return apiFetch<Venue>(`/venues/${id}`);
}

/** Fetch all clips for a venue, newest first. */
export function fetchVenueClips(venueId: string): Promise<Clip[]> {
  return apiFetch<Clip[]>(`/venues/${venueId}/clips`);
}

/** Register a new user account. */
export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
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
  const res = await fetch(`${baseUrl}/auth/login`, {
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

/** Venue with dashboard stats, returned by fetchMyVenues(). */
export interface VenueWithStats {
  id: string;
  name: string;
  type: string;
  location: string;
  city: string;
  hours: string | null;
  musicGenre: string[];
  claimedBy: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalClips: number;
    totalViews: number;
    clipsThisWeek: number;
  };
  recentClips: {
    id: string;
    views: number;
    createdAt: string;
    caption: string | null;
    thumbnail: string | null;
    duration: number;
  }[];
}

/** Fetch venues owned by the current user with stats (auth required). */
export async function fetchMyVenues(token: string): Promise<VenueWithStats[]> {
  const res = await fetch(`${baseUrl}/venues/my/venues`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Failed to fetch venues: ${res.status}`);
  }

  return body as VenueWithStats[];
}

/** Claim a venue as the current user (auth required). */
export async function claimVenue(
  venueId: string,
  token: string
): Promise<Venue> {
  const res = await fetch(`${baseUrl}/venues/${venueId}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Claim failed: ${res.status}`);
  }

  return body as Venue;
}

/** Record a view for a clip. Returns the updated view count. */
export async function recordClipView(
  id: string
): Promise<{ id: string; views: number }> {
  const res = await fetch(`${baseUrl}/clips/${id}/view`, {
    method: 'POST',
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `View tracking failed: ${res.status}`);
  }

  return body as { id: string; views: number };
}
