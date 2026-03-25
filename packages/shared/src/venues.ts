import { Venue } from './types';
import { VenueType } from './enums';

export interface BrowseVenueGroups {
  live: Venue[];
  offline: Venue[];
}

export function filterVenues(
  venues: Venue[],
  venueTypeFilter: VenueType | null,
  musicGenreFilter: string | null
): Venue[] {
  return venues.filter((venue) => {
    if (venueTypeFilter && venue.type !== venueTypeFilter) return false;
    if (musicGenreFilter && !venue.musicGenre.includes(musicGenreFilter)) return false;
    return true;
  });
}

export function groupBrowseVenues(venues: Venue[]): BrowseVenueGroups {
  const live: Venue[] = [];
  const offline: Venue[] = [];

  for (const venue of venues) {
    if (venue.isLive) {
      live.push(venue);
    } else {
      offline.push(venue);
    }
  }

  return { live, offline };
}

export function pickFeaturedVenue(groups: BrowseVenueGroups): Venue | null {
  const all = [...groups.live, ...groups.offline];
  if (all.length === 0) return null;
  return all.reduce((best, v) => ((v.vibeScore ?? 0) > (best.vibeScore ?? 0) ? v : best));
}

export function excludeFeaturedVenue(venues: Venue[], featuredVenue: Venue | null): Venue[] {
  if (!featuredVenue) return venues;
  return venues.filter((venue) => venue.id !== featuredVenue.id);
}
