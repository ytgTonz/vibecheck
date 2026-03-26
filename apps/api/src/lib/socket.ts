import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

/** Initialise Socket.IO and attach it to the HTTP server. */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*' },
    path: '/ws',
  });

  io.on('connection', (socket: Socket) => {
    console.log('[WS] client connected:', socket.id);
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
