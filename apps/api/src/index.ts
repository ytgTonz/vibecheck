import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues';
import clipRoutes from './routes/clips';
import authRoutes from './routes/auth';
import feedbackRoutes from './routes/feedback';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/venues', venueRoutes);
app.use('/clips', clipRoutes);
app.use('/feedback', feedbackRoutes);

app.listen(PORT, () => {
  console.log(`VibeCheck API running on port ${PORT}`);
});
