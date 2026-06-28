import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`👉 Backend API available at: http://localhost:${env.PORT}`);
  logger.info(`👉 CORS allowed origin: ${env.FRONTEND_URL}`);
});

// Configure timeouts to allow very long media streams/downloads (like 24-hour videos)
server.timeout = env.DOWNLOAD_TIMEOUT;
server.keepAliveTimeout = Math.min(env.DOWNLOAD_TIMEOUT || 120000, 120000); // Prevent keepAlive from locking sockets permanently if set to 0, default to 120s max
server.headersTimeout = env.DOWNLOAD_TIMEOUT;
server.requestTimeout = env.DOWNLOAD_TIMEOUT;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('❌ Unhandled Promise Rejection:');
  logger.error(err.stack || err.message);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('❌ Uncaught Exception:');
  logger.error(err.stack || err.message);
  
  server.close(() => {
    process.exit(1);
  });
});

// Handle termination signals
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});
