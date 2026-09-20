/**
 * BYOK (Bring Your Own Keys) & Circuit Breaker Governance Routes
 * 
 * Endpoints:
 * - GET  /api/byok/:tenantId        - Get BYOK key configuration status
 * - POST /api/byok/keys             - Save BYOK keys & activate BYOK mode on circuit breaker
 * - GET  /api/byok/status/:tenantId - Get circuit breaker status and gross margin metrics
 * - POST /api/byok/reset-breaker    - Administrative reset of tripped breaker
 */

import { Router, Request, Response } from 'express';
import { tenantCircuitBreaker } from '../engine/circuit_breaker.js';

export const byokRoutes = Router();

interface TenantByokKeys {
  tenantId: string;
  openaiKey?: string;
  anthropicKey?: string;
  deepseekKey?: string;
  stripeSecretKey?: string;
  githubToken?: string;
  updatedAt: string;
}

const keyStore: Map<string, TenantByokKeys> = new Map();

function maskKey(key?: string): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// GET /api/byok/:tenantId
byokRoutes.get('/:tenantId', (req: Request, res: Response) => {
  const tenantId = String(req.params.tenantId);
  const keys = keyStore.get(tenantId);
  const breaker = tenantCircuitBreaker.getRecord(tenantId);

  res.json({
    tenantId,
    byokActive: breaker.byokMode,
    configuredProviders: {
      openai: !!keys?.openaiKey,
      anthropic: !!keys?.anthropicKey,
      deepseek: !!keys?.deepseekKey,
      stripe: !!keys?.stripeSecretKey,
      github: !!keys?.githubToken,
    },
    maskedKeys: {
      openai: maskKey(keys?.openaiKey),
      anthropic: maskKey(keys?.anthropicKey),
      deepseek: maskKey(keys?.deepseekKey),
      stripe: maskKey(keys?.stripeSecretKey),
      github: maskKey(keys?.githubToken),
    },
    circuitBreaker: breaker,
  });
});

// POST /api/byok/keys
byokRoutes.post('/keys', (req: Request, res: Response) => {
  const { tenantId = 'tenant-default', openaiKey, anthropicKey, deepseekKey, stripeSecretKey, githubToken } = req.body;

  const current: TenantByokKeys = keyStore.get(tenantId) || { tenantId, updatedAt: new Date().toISOString() };
  if (openaiKey) current.openaiKey = openaiKey;
  if (anthropicKey) current.anthropicKey = anthropicKey;
  if (deepseekKey) current.deepseekKey = deepseekKey;
  if (stripeSecretKey) current.stripeSecretKey = stripeSecretKey;
  if (githubToken) current.githubToken = githubToken;
  current.updatedAt = new Date().toISOString();

  keyStore.set(tenantId, current);

  // Switch circuit breaker to BYOK mode (eliminates platform COGS liability)
  const updatedBreaker = tenantCircuitBreaker.switchToByok(tenantId);

  res.json({
    message: 'BYOK keys saved; BYOK mode activated ($0.00 platform token COGS)',
    tenantId,
    circuitBreaker: updatedBreaker,
  });
});

// GET /api/byok/status/:tenantId
byokRoutes.get('/status/:tenantId', (req: Request, res: Response) => {
  const tenantId = String(req.params.tenantId);
  const breaker = tenantCircuitBreaker.getRecord(tenantId);
  const margin = tenantCircuitBreaker.calculateGrossMargin(tenantId);

  res.json({
    circuitBreaker: breaker,
    grossMargin: margin,
  });
});

// POST /api/byok/reset-breaker
byokRoutes.post('/reset-breaker', (req: Request, res: Response) => {
  const { tenantId = 'tenant-default' } = req.body;
  const breaker = tenantCircuitBreaker.resetBreaker(tenantId);
  res.json({
    message: 'Circuit breaker reset successfully',
    circuitBreaker: breaker,
  });
});
