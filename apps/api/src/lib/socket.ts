import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../middleware/auth';

let io: Server | null = null;

/** Initialise Socket.IO and attach it to the HTTP server. */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*' },
    path: '/ws',
  });

  io.on('connection', (socket: Socket) => {
    console.log('[WS] client connected:', socket.id);

    // Join role/user rooms if the client provided an auth token
    const token = socket.handshake.auth?.token as string | undefined;
    if (token && process.env.JWT_SECRET) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET) as AuthPayload;
        socket.join(`user:${payload.userId}`);
        socket.join(`role:${payload.role}`);
        console.log('[WS] authenticated:', payload.userId, 'role:', payload.role);
      } catch {
        // Invalid token — socket stays connected but won't receive targeted events
      }
    }

    socket.on('disconnect', () => {
      console.log('[WS] client disconnected:', socket.id);
    });
  });

  return io;
}

/** Get the Socket.IO server instance. */
export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialised — call initSocket first');
  return io;
}

// ─── Event helpers ──────────────────────────────────────────────────────────

export interface StreamEvent {
  venueId: string;
  streamId: string;
}

export interface ViewerEvent extends StreamEvent {
  currentViewerCount: number;
}

/** A stream was created (IDLE). */
export function emitStreamStarted(data: StreamEvent) {
  getIO().emit('stream:started', data);
}

/** A stream went LIVE (media published). */
export function emitStreamLive(data: StreamEvent) {
  getIO().emit('stream:live', data);
}

/** A stream ended. */
export function emitStreamEnded(data: StreamEvent) {
  getIO().emit('stream:ended', data);
}

/** Viewer count changed. */
export function emitViewerUpdate(data: ViewerEvent) {
  getIO().emit('stream:viewers', data);
}
