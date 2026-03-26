import { io, Socket } from 'socket.io-client';

// ─── Event types ────────────────────────────────────────────────────────────

export interface StreamEvent {
  venueId: string;
  streamId: string;
}

export interface ViewerEvent extends StreamEvent {
  currentViewerCount: number;
}

export type SocketEvents = {
  'stream:started': (data: StreamEvent) => void;
  'stream:live': (data: StreamEvent) => void;
  'stream:ended': (data: StreamEvent) => void;
  'stream:viewers': (data: ViewerEvent) => void;
};

// ─── Singleton socket ───────────────────────────────────────────────────────

let socket: Socket | null = null;

function resolveWsUrl(): string {
  const envBaseUrl =
    (typeof process !== 'undefined' && (
      process.env?.NEXT_PUBLIC_API_URL ||
      process.env?.EXPO_PUBLIC_API_URL
    )) || 'http://localhost:3001';

  return envBaseUrl.replace(/\/+$/, '');
}

/** Get (or create) the shared Socket.IO client. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveWsUrl(), {
      path: '/ws',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

/** Disconnect the shared socket (for cleanup). */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
