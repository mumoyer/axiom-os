/**
 * Stage Gate OS Server Listener Entry Point
 * Listens on Port 3000 (default) with graceful termination hooks.
 */

import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  console.log(`[Stage Gate OS Engine] Primary listener active on port ${PORT} (Environment: ${process.env.NODE_ENV || 'development'})`);
  console.log(`  Health probe: http://localhost:${PORT}/api/healthz`);
  console.log(`  Telemetry SSE: http://localhost:${PORT}/api/telemetry/stream/:ventureId`);
  console.log(`  Venture API:  http://localhost:${PORT}/api/ventures`);
});

// Dual-port binding: Ensure Railway port 8080 and 3000 both route seamlessly
let secondaryServer: any = null;
if (PORT !== 8080) {
  try {
    secondaryServer = app.listen(8080, () => {
      console.log('[Stage Gate OS Engine] Secondary listener active on port 8080 for Railway custom domain routing');
    });
    secondaryServer.on('error', (err: any) => {
      if (err.code !== 'EADDRINUSE') {
        console.warn('[Stage Gate OS Engine] Secondary port 8080 bind note:', err.message);
      }
    });
  } catch (err: any) {
    // Port 8080 optional fallback
  }
}

// Graceful termination handling
const shutdown = (signal: string) => {
  console.log(`[Stage Gate OS Engine] Received ${signal}. Shutting down cleanly...`);
  if (secondaryServer) {
    try { secondaryServer.close(); } catch {}
  }
  server.close(() => {
    console.log('[Stage Gate OS Engine] HTTP server closed.');
    process.exit(0);
  });
};

process.on('uncaughtException', (err) => {
  console.error('[Stage Gate OS Engine] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Stage Gate OS Engine] Unhandled Rejection:', reason);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server };
