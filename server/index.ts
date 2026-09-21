/**
 * Stage Gate OS Server Listener Entry Point
 * Listens on Port 3000 (default) with graceful termination hooks.
 */

import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3005', 10);

const server = app.listen(PORT, () => {
  console.log(`[Stage Gate OS Engine] Running on port ${PORT} (Environment: ${process.env.NODE_ENV || 'development'})`);
  console.log(`  Health probe: http://localhost:${PORT}/api/healthz`);
  console.log(`  Telemetry SSE: http://localhost:${PORT}/api/telemetry/stream/:ventureId`);
  console.log(`  Venture API:  http://localhost:${PORT}/api/ventures`);
});

// Graceful termination handling
const shutdown = (signal: string) => {
  console.log(`[Stage Gate OS Engine] Received ${signal}. Shutting down cleanly...`);
  server.close(() => {
    console.log('[Stage Gate OS Engine] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server };
