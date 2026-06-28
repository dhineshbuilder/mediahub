import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { rateLimiterMiddleware } from './middlewares/rate-limiter.middleware';
import captionRoutes from './routes/caption.routes';
import mediaRoutes from './routes/media.routes';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logger
app.use(loggerMiddleware);

// Rate Limiter
app.use('/api', rateLimiterMiddleware);

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Media Routes
app.use('/api', mediaRoutes);

// Caption Routes
app.use('/api/captions', captionRoutes);

// Catch-all route handler for 404
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
});

// Centralized Error Middleware
app.use(errorMiddleware);

export default app;
