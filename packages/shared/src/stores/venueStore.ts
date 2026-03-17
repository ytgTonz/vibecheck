import { create } from 'zustand';
import { Venue } from '../types';
import { VenueType } from '../enums';
import { fetchVenues } from '../api';

interface VenueState {
  /** All venues from the API. */
  venues: Venue[];

  /** True while the initial fetch is in progress. */
  loading: boolean;

  /** Error message if the fetch failed. */
  error: string | null;

  /** Active venue type filter — null means "show all". */
  venueTypeFilter: VenueType | null;

  /** Active music genre filter — null means "show all". */
  musicGenreFilter: string | null;

  /** Fetch all venues from the API and store them. */
  loadVenues: () => Promise<void>;

  /** Set the venue type filter. Pass null to clear. */
  setVenueTypeFilter: (type: VenueType | null) => void;

  /** Set the music genre filter. Pass null to clear. */
  setMusicGenreFilter: (genre: string | null) => void;

  /** Clear all filters. */
  clearFilters: () => void;

  /** Returns venues matching the active filters. */
  filteredVenues: () => Venue[];
}

export const useVenueStore = create<VenueState>((set, get) => ({
  venues: [],
  loading: false,
  error: null,
  venueTypeFilter: null,
  musicGenreFilter: null,

  loadVenues: async () => {
    set({ loading: true, error: null });
    try {
      const venues = await fetchVenues();
      set({ venues, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load venues';
      set({ error: message, loading: false });
    }
  },

  setVenueTypeFilter: (type) => set({ venueTypeFilter: type }),

  setMusicGenreFilter: (genre) => set({ musicGenreFilter: genre }),

  clearFilters: () => set({ venueTypeFilter: null, musicGenreFilter: null }),

  filteredVenues: () => {
    const { venues, venueTypeFilter, musicGenreFilter } = get();

    return venues.filter((venue) => {
      if (venueTypeFilter && venue.type !== venueTypeFilter) return false;
      if (musicGenreFilter && !venue.musicGenre.includes(musicGenreFilter)) return false;
      return true;
    });
  },
}));
