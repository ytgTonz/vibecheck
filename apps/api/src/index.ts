import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import venueRoutes from './routes/venues';
import authRoutes from './routes/auth';
import feedbackRoutes from './routes/feedback';
import adminRoutes from './routes/admin';
import streamRoutes from './routes/streams';
import notificationRoutes from './routes/notifications';
import webhookRoutes from './routes/webhooks';
import attendanceRoutes from './routes/attendance';
import visitsRoutes from './routes/visits';
import incentivesRoutes from './routes/incentives';
import { initSocket } from './lib/socket';
import { startNotificationPoller, startReceiptPoller } from './lib/scheduledNotifications';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialise Socket.IO
initSocket(httpServer);

// Start scheduled notification poller
startNotificationPoller();

// Start Expo receipt poller — prunes dead push tokens every 15 minutes
startReceiptPoller();

// Middleware
app.use(cors());

morgan.token('client', (req: express.Request) => (req.headers['x-client'] as string) ?? 'unknown');
app.use(morgan('[:date[iso]] :method :url :status :response-time ms — client=:client ip=:remote-addr'));

// Webhook routes need raw body — register BEFORE express.json()
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/venues', venueRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/admin', adminRoutes);
app.use('/streams', streamRoutes);
app.use('/notifications', notificationRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/visits', visitsRoutes);
app.use('/incentives', incentivesRoutes);

httpServer.listen(PORT, () => {
  console.log(`VibeCheck API running on port ${PORT}`);
});
