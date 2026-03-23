import { create } from 'zustand';

interface BroadcastState {
  /** Venue ID of the active broadcast, or null if not broadcasting. */
  venueId: string | null;
  /** Stream ID of the active broadcast. */
  streamId: string | null;
  /** Venue name for display purposes. */
  venueName: string | null;
  /** LiveKit token for reconnecting to the room. */
  livekitToken: string | null;

  /** Set the active broadcast when going live. */
  setBroadcast: (venueId: string, streamId: string, venueName: string, livekitToken: string) => void;
  /** Clear the active broadcast when stream ends. */
  clearBroadcast: () => void;
}

export const useBroadcastStore = create<BroadcastState>((set) => ({
  venueId: null,
  streamId: null,
  venueName: null,
  livekitToken: null,

  setBroadcast: (venueId, streamId, venueName, livekitToken) =>
    set({ venueId, streamId, venueName, livekitToken }),

  clearBroadcast: () =>
    set({ venueId: null, streamId: null, venueName: null, livekitToken: null }),
}));
