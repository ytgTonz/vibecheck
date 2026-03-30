import './config/env'; // validate env vars before anything else
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues';
import authRoutes from './routes/auth';
import feedbackRoutes from './routes/feedback';
import adminRoutes from './routes/admin';
import streamRoutes from './routes/streams';
import notificationRoutes from './routes/notifications';
import webhookRoutes from './routes/webhooks';
import attendanceRoutes from './routes/attendance';
import { initSocket } from './lib/socket';
import { startNotificationPoller, startReceiptPoller } from './lib/scheduledNotifications';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/env';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialise Socket.IO
initSocket(httpServer);

// Start scheduled notification poller
startNotificationPoller();

// Start Expo receipt poller — prunes dead push tokens every 15 minutes
startReceiptPoller();

// Middleware
app.use(cors());

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

// Global error handler — must be last
app.use(errorHandler);

httpServer.listen(config.PORT, () => {
  // Server started
});
