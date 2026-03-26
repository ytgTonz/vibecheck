import { useEffect, useRef } from 'react';
import { getSocket, StreamEvent, ViewerEvent, NotificationEvent, AttendanceUpdateEvent } from '../socket';

type EventMap = {
  'stream:started': StreamEvent;
  'stream:live': StreamEvent;
  'stream:ended': StreamEvent;
  'stream:viewers': ViewerEvent;
  'notification': NotificationEvent;
  'attendance:update': AttendanceUpdateEvent;
};

/**
 * Subscribe to one or more Socket.IO events.
 * Automatically connects on mount and cleans up listeners on unmount.
 *
 * Usage:
 *   useSocket({
 *     'stream:live': (data) => { ... },
 *     'stream:ended': (data) => { ... },
 *   });
 */
export function useSocket(
  handlers: Partial<{ [K in keyof EventMap]: (data: EventMap[K]) => void }>,
) {
  // Stable ref so we don't re-subscribe on every render
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getSocket();

    const wrappers: Array<[string, (...args: unknown[]) => void]> = [];

    for (const [event, handler] of Object.entries(handlersRef.current)) {
      if (!handler) continue;
      const wrapper = (...args: unknown[]) => {
        const current = handlersRef.current[event as keyof EventMap];
        if (current) (current as (...a: unknown[]) => void)(...args);
      };
      socket.on(event, wrapper);
      wrappers.push([event, wrapper]);
    }

    return () => {
      for (const [event, wrapper] of wrappers) {
        socket.off(event, wrapper);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
