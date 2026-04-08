import { Dispatch, SetStateAction, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useVenueStore } from '../stores/venueStore';
import { StreamEvent, ViewerEvent } from '../socket';
import { VenueWithStats } from '../api';

/**
 * Subscribes to live stream socket events and keeps both a local venue list
 * and the shared venue store in sync.
 *
 * Usage (dashboard):
 *   useVenueLiveUpdates(setVenues);
 */
export function useVenueLiveUpdates(
  setLocalVenues: Dispatch<SetStateAction<VenueWithStats[]>>,
) {
  const { setVenueLive, setVenueOffline, setViewerCount } = useVenueStore();

  const handleStreamLive = useCallback(
    (data: StreamEvent) => {
      setLocalVenues((prev) =>
        prev.map((v) =>
          v.id === data.venueId
            ? { ...v, isLive: true, activeStreamId: data.streamId, currentViewerCount: 0 }
            : v,
        ),
      );
      setVenueLive(data.venueId, data.streamId);
    },
    [setLocalVenues, setVenueLive],
  );

  const handleStreamEnded = useCallback(
    (data: StreamEvent) => {
      setLocalVenues((prev) =>
        prev.map((v) =>
          v.id === data.venueId
            ? { ...v, isLive: false, activeStreamId: undefined, currentViewerCount: 0 }
            : v,
        ),
      );
      setVenueOffline(data.venueId);
    },
    [setLocalVenues, setVenueOffline],
  );

  const handleViewerUpdate = useCallback(
    (data: ViewerEvent) => {
      setLocalVenues((prev) =>
        prev.map((v) =>
          v.id === data.venueId ? { ...v, currentViewerCount: data.currentViewerCount } : v,
        ),
      );
      setViewerCount(data.venueId, data.currentViewerCount);
    },
    [setLocalVenues, setViewerCount],
  );

  useSocket({
    'stream:live': handleStreamLive,
    'stream:ended': handleStreamEnded,
    'stream:viewers': handleViewerUpdate,
  });
}
