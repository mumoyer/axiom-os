/**
 * Real-Time Telemetry SSE Routes
 * 
 * Endpoint:
 * - GET /api/telemetry/stream/:ventureId - Server-Sent Events stream for real-time audit logs & stage-gate progression
 */

import { Router, Request, Response } from 'express';
import { stageGateRunner } from '../engine/stage_gate_runner.js';

export const telemetryRoutes = Router();

telemetryRoutes.get('/stream/:ventureId', (req: Request, res: Response) => {
  const ventureId = String(req.params.ventureId);

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  // Flush initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', ventureId, timestamp: new Date().toISOString() })}\n\n`);

  // If venture execution already exists, send current snapshot
  const currentExec = stageGateRunner.getExecution(ventureId);
  if (currentExec) {
    res.write(`data: ${JSON.stringify({ type: 'SNAPSHOT', payload: currentExec })}\n\n`);
  }

  // Subscribe to real-time events from StageGateRunner
  const unsubscribe = stageGateRunner.subscribeTelemetry(ventureId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Keep-alive heartbeat every 15 seconds
  const heartbeatTimer = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatTimer);
    unsubscribe();
    res.end();
  });
});
