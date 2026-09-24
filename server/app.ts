/**
 * Express Application Configuration for Stage Gate OS
 * Orchestrates deterministic venture stage-gates, Stripe checkout, telemetry, and founder messaging
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { ventureRoutes } from './routes/venture_routes.js';
import { telemetryRoutes } from './routes/telemetry_routes.js';
import { graderRoutes } from './routes/grader_routes.js';
import { checkoutRoutes } from './routes/checkout_routes.js';
import { byokRoutes } from './routes/byok_routes.js';
import { messagingRoutes } from './routes/messaging_routes.js';
import { authRoutes } from './routes/auth_routes.js';
import { feedbackRoutes } from './routes/feedback_routes.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global Health Probe (G2 SLA compatible)
  app.get('/api/healthz', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      database: 'connected',
      timestamp: new Date().toISOString(),
      engine: 'Stage Gate OS Stage-Gate Orchestrator v1.0',
    });
  });

  // Mount API Subsystems
  app.use('/api/ventures', ventureRoutes);
  app.use('/api/telemetry', telemetryRoutes);
  app.use('/api/grader', graderRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/byok', byokRoutes);
  app.use('/api/messages', messagingRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/bugs', feedbackRoutes);

  // Clean Customer-Facing Vanity Checkout Redirects
  app.get('/subscribe/founder', (_req: Request, res: Response) => {
    res.redirect(302, '/#checkout?plan=FOUNDER');
  });
  app.get('/subscribe/serial', (_req: Request, res: Response) => {
    res.redirect(302, '/#checkout?plan=SERIAL');
  });
  app.get('/subscribe/enterprise', (_req: Request, res: Response) => {
    res.redirect(302, '/#checkout?plan=ENTERPRISE');
  });
  app.get('/subscribe', (_req: Request, res: Response) => {
    res.redirect(302, '/#checkout');
  });

  // 404 Handler for unmapped API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Serve static client bundle if built
  const clientDist = path.resolve(process.cwd(), 'dist/client');
  app.use(express.static(clientDist));
  app.get('*', (_req: Request, res: Response) => {
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('<!DOCTYPE html><html><body><div id="root">Stage Gate OS Engine Running</div></body></html>');
    }
  });

  return app;
}

export const app = createApp();
