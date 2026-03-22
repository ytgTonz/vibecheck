import { Venue } from './types';
import { VenueType } from './enums';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface BrowseVenueGroups {
  streaming: Venue[];
  live: Venue[];
  fresh: Venue[];
  quiet: Venue[];
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

export function groupBrowseVenues(
  venues: Venue[],
  now = Date.now()
): BrowseVenueGroups {
  const streaming: Venue[] = [];
  const live: Venue[] = [];
  const fresh: Venue[] = [];
  const quiet: Venue[] = [];

  for (const venue of venues) {
    if (venue.isLive) {
      streaming.push(venue);
      continue;
    }

    if (!venue.lastClipAt) {
      quiet.push(venue);
      continue;
    }

    const age = now - new Date(venue.lastClipAt).getTime();

    if (age < TWO_HOURS_MS) live.push(venue);
    else if (age < TWENTY_FOUR_HOURS_MS) fresh.push(venue);
    else quiet.push(venue);
  }

  return { streaming, live, fresh, quiet };
}

export function pickFeaturedVenue(groups: BrowseVenueGroups): Venue | null {
  return groups.streaming[0] ?? groups.live[0] ?? groups.fresh[0] ?? groups.quiet[0] ?? null;
}

export function excludeFeaturedVenue(venues: Venue[], featuredVenue: Venue | null): Venue[] {
  if (!featuredVenue) return venues;
  return venues.filter((venue) => venue.id !== featuredVenue.id);
}
