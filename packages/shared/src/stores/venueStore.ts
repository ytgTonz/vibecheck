import { create } from 'zustand';
import { Venue } from '../types';
import { VenueType } from '../enums';
import { fetchVenues } from '../api';
import { filterVenues, groupBrowseVenues } from '../venues';

export interface VenueSection {
  live: Venue[];
  offline: Venue[];
}

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

  /** Returns filtered venues split into live/fresh/quiet sections. */
  groupedVenues: () => VenueSection;

  /** Mark a venue as live (from WebSocket event). */
  setVenueLive: (venueId: string, streamId: string) => void;

  /** Mark a venue as offline (from WebSocket event). */
  setVenueOffline: (venueId: string) => void;

  /** Update viewer count for a venue (from WebSocket event). */
  setViewerCount: (venueId: string, count: number) => void;
}

export const useVenueStore = create<VenueState>((set, get) => ({
  venues: [],
  loading: false,
  error: null,
  venueTypeFilter: null,
  musicGenreFilter: null,

  loadVenues: async () => {
    const isInitialLoad = get().venues.length === 0;
    if (isInitialLoad) {
      set({ loading: true, error: null });
    }
    try {
      const venues = await fetchVenues();
      set({ venues, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load venues';
      // Only show error on initial load — don't flash errors during background polls
      if (isInitialLoad) {
        set({ error: message, loading: false });
      }
    }
  },

  setVenueTypeFilter: (type) => set({ venueTypeFilter: type }),

  setMusicGenreFilter: (genre) => set({ musicGenreFilter: genre }),

  clearFilters: () => set({ venueTypeFilter: null, musicGenreFilter: null }),

  filteredVenues: () => {
    const { venues, venueTypeFilter, musicGenreFilter } = get();
    return filterVenues(venues, venueTypeFilter, musicGenreFilter);
  },

  groupedVenues: () => {
    const { live, offline } = groupBrowseVenues(get().filteredVenues());
    return { live, offline };
  },

  setVenueLive: (venueId, streamId) =>
    set({
      venues: get().venues.map((v) =>
        v.id === venueId ? { ...v, isLive: true, activeStreamId: streamId } : v
      ),
    }),

  setVenueOffline: (venueId) =>
    set({
      venues: get().venues.map((v) =>
        v.id === venueId ? { ...v, isLive: false, activeStreamId: undefined } : v
      ),
    }),

  setViewerCount: (venueId, count) =>
    set({
      venues: get().venues.map((v) =>
        v.id === venueId ? { ...v, currentViewerCount: count } : v
      ),
    }),
}));
