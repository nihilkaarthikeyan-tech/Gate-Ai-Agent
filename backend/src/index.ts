import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import tutorRoutes from './routes/tutor.routes';
import plannerRoutes from './routes/planner.routes';
import pyqRoutes from './routes/pyq.routes';
// Phase 3
import mocktestRoutes from './routes/mocktest.routes';
import flashcardRoutes from './routes/flashcard.routes';
import notesRoutes from './routes/notes.routes';
import shortcutsRoutes from './routes/shortcuts.routes';
import liveexamRoutes from './routes/liveexam.routes';
// Phase 4
import analyticsRoutes from './routes/analytics.routes';
// Phase 5
import advancedRoutes from './routes/advanced.routes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { seedShortcuts } from './seed-shortcuts';

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'ANTHROPIC_API_KEY'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').trim(),
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Phase 1 & 2
app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/pyq', pyqRoutes);

// Phase 3
app.use('/api/mock-tests', mocktestRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/shortcuts', shortcutsRoutes);
app.use('/api/live-exams', liveexamRoutes);

// Phase 4
app.use('/api/analytics', analyticsRoutes);

// Phase 5
app.use('/api/advanced', advancedRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GATE AI Platform API is running', phase: 5 });
});

app.listen(port, () => {
  console.log(`🚀 GATE AI Platform API running on port ${port}`);
  seedShortcuts();
});
