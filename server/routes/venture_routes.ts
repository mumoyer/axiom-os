/**
 * Venture API Routes
 * 
 * Endpoints:
 * - GET  /api/ventures           - List all ventures
 * - GET  /api/ventures/:id       - Get venture execution state
 * - POST /api/ventures           - Scaffold venture and trigger 5-stage gate pipeline
 * - POST /api/ventures/:id/retry - Retry failed venture pipeline
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { stageGateRunner } from '../engine/stage_gate_runner.js';
import { escrowLedger } from '../engine/escrow_ledger.js';

export const ventureRoutes = Router();

// In-memory venture metadata registry
interface VentureMetadata {
  id: string;
  name: string;
  tenantId: string;
  planTier: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  description?: string;
  createdAt: string;
}

const ventures: Map<string, VentureMetadata> = new Map();

// Seed initial test venture if empty
if (ventures.size === 0) {
  const seedId = 'seed-venture-001';
  ventures.set(seedId, {
    id: seedId,
    name: 'Axiom Pulse Analytics',
    tenantId: 'tenant-default',
    planTier: 'FOUNDER',
    description: 'Autonomous AI analytics platform for modern founders',
    createdAt: new Date().toISOString(),
  });
}

// GET /api/ventures
ventureRoutes.get('/', (_req: Request, res: Response) => {
  const executions = stageGateRunner.getAllExecutions();
  const list = Array.from(ventures.values()).map((v) => {
    const exec = executions.find((e) => e.ventureId === v.id);
    return {
      ...v,
      pipeline: exec || null,
    };
  });
  res.json({ ventures: list });
});

// GET /api/ventures/:id
ventureRoutes.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const venture = ventures.get(id);
  const pipeline = stageGateRunner.getExecution(id);

  if (!venture && !pipeline) {
    res.status(404).json({ error: `Venture not found: ${id}` });
    return;
  }

  res.json({
    venture: venture || { id, name: pipeline?.ventureName, tenantId: pipeline?.tenantId },
    pipeline: pipeline || null,
  });
});

// POST /api/ventures
ventureRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      tenantId = 'tenant-default',
      planTier = 'FOUNDER',
      description,
      failureSimulations,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Venture name is required' });
      return;
    }

    const id = `ven_${randomUUID().slice(0, 8)}`;
    const venture: VentureMetadata = {
      id,
      name,
      tenantId,
      planTier,
      description,
      createdAt: new Date().toISOString(),
    };
    ventures.set(id, venture);

    // Ensure wallet is funded for tenant
    escrowLedger.getOrCreateWallet(tenantId, 100.0);

    // Launch stage-gate pipeline asynchronously or await depending on query
    const asyncExecution = req.query.async === 'true';

    if (asyncExecution) {
      // Fire-and-forget pipeline run in background
      stageGateRunner
        .executePipeline({
          ventureId: id,
          ventureName: name,
          tenantId,
          planTier,
          config: {
            failureSimulations,
          },
        })
        .catch((err) => console.error(`[Pipeline Error] ${id}:`, err.message));

      res.status(202).json({
        message: 'Venture initiated; pipeline running asynchronously',
        venture,
        telemetryUrl: `/api/telemetry/stream/${id}`,
      });
      return;
    }

    // Synchronous execution for immediate testing
    const pipeline = await stageGateRunner.executePipeline({
      ventureId: id,
      ventureName: name,
      tenantId,
      planTier,
      config: {
        failureSimulations,
      },
    });

    res.status(201).json({
      venture,
      pipeline,
      telemetryUrl: `/api/telemetry/stream/${id}`,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      code: err.message.includes('CIRCUIT_BREAKER')
        ? 'TENANT_CIRCUIT_BREAKER_TRIPPED'
        : 'PIPELINE_ERROR',
    });
  }
});

// POST /api/ventures/:id/retry
ventureRoutes.post('/:id/retry', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const venture = ventures.get(id);

  if (!venture) {
    res.status(404).json({ error: `Venture not found: ${id}` });
    return;
  }

  try {
    const pipeline = await stageGateRunner.executePipeline({
      ventureId: id,
      ventureName: venture.name,
      tenantId: venture.tenantId,
      planTier: venture.planTier,
      config: {
        failureSimulations: req.body.failureSimulations,
      },
    });
    res.json({ venture, pipeline });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
