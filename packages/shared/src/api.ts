import { Venue, Clip } from './types';

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
