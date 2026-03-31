import { io, Socket } from 'socket.io-client';
import type { NotificationType } from './types/models';

// ─── Event types ────────────────────────────────────────────────────────────

export interface StreamEvent {
  venueId: string;
  streamId: string;
}

export interface ViewerEvent extends StreamEvent {
  currentViewerCount: number;
}

export interface NotificationEvent {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface AttendanceUpdateEvent extends StreamEvent {
  intentCount: number;
  arrivalCount: number;
}

export type SocketEvents = {
  'stream:started': (data: StreamEvent) => void;
  'stream:live': (data: StreamEvent) => void;
  'stream:ended': (data: StreamEvent) => void;
  'stream:viewers': (data: ViewerEvent) => void;
  'notification': (data: NotificationEvent) => void;
  'attendance:update': (data: AttendanceUpdateEvent) => void;
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

/** Get (or create) the shared Socket.IO client. Optionally pass an auth token for targeted notifications. */
export function getSocket(authToken?: string): Socket {
  if (!socket) {
    const wsUrl = resolveWsUrl();
    console.log('[Socket] creating client', { url: wsUrl });

    socket = io(wsUrl, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      ...(authToken ? { auth: { token: authToken } } : {}),
    });

    socket.on('connect', () => {
      console.log('[Socket] connected', { id: socket?.id, url: wsUrl });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected', { reason });
    });

    socket.on('connect_error', (error) => {
      console.log('[Socket] connect_error', {
        message: error.message,
        url: wsUrl,
      });
    });
  }
  return socket;
}

/**
 * Disconnect the shared socket (for cleanup).
 * Call this on logout so the next login can reconnect with a fresh auth token.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
