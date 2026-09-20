/**
 * Venture Validation Grader (VVG) & Lead Generation Routes
 * 
 * Implements the 4-factor scoring algorithm:
 * - Market Demand (Weight: 30%)
 * - Competitor Density (Weight: 25%)
 * - Unit Economics (Weight: 25%)
 * - Technical Feasibility (Weight: 20%)
 * 
 * Endpoints:
 * - POST /api/grader/score - Compute deterministic 4-factor validation score and analysis
 * - POST /api/grader/leads - Capture founder contact information and generate report receipt
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export interface GraderInput {
  ventureName: string;
  industry: string;
  tamUsd: number;
  samUsd: number;
  directCompetitorsCount: number;
  differentiationFactor: number; // 1 - 5
  estimatedCacUsd: number;
  estimatedLtvUsd: number;
  paybackMonths: number;
  techComplexity: number; // 1 - 5
  regulatoryRisk: number; // 1 - 5
  founderExperienceYears: number;
}

export interface GraderScoreResult {
  overallScore: number;
  gradeBracket: 'A' | 'B' | 'C' | 'F';
  factorScores: {
    marketDemand: number;
    competitorDensity: number;
    unitEconomics: number;
    technicalFeasibility: number;
  };
  keyRisks: string[];
  recommendations: string[];
  suggestedPivots?: string[];
}

export function calculateGraderScore(input: GraderInput): GraderScoreResult {
  // 1. Market Demand (30% weight)
  let marketDemand = 50;
  if (input.tamUsd >= 10_000_000_000) marketDemand = 95;
  else if (input.tamUsd >= 1_000_000_000) marketDemand = 85;
  else if (input.tamUsd >= 100_000_000) marketDemand = 75;
  else if (input.tamUsd >= 10_000_000) marketDemand = 60;
  else marketDemand = 40;

  // Adjust for SAM/TAM viability
  const samRatio = input.tamUsd > 0 ? input.samUsd / input.tamUsd : 0;
  if (samRatio > 0.05 && samRatio < 0.35) marketDemand = Math.min(100, marketDemand + 5);

  // 2. Competitor Density (25% weight)
  let competitorDensity = 70;
  if (input.directCompetitorsCount <= 2) {
    competitorDensity = 90;
  } else if (input.directCompetitorsCount <= 5) {
    competitorDensity = 80;
  } else if (input.directCompetitorsCount <= 12) {
    competitorDensity = 65;
  } else {
    competitorDensity = 45;
  }
  // Bonus/penalty based on differentiation (1-5)
  competitorDensity += (input.differentiationFactor - 3) * 8;
  competitorDensity = Math.max(10, Math.min(100, competitorDensity));

  // 3. Unit Economics (25% weight)
  let unitEconomics = 60;
  const ltvCacRatio = input.estimatedCacUsd > 0 ? input.estimatedLtvUsd / input.estimatedCacUsd : 1.0;
  if (ltvCacRatio >= 5.0) unitEconomics = 95;
  else if (ltvCacRatio >= 3.5) unitEconomics = 85;
  else if (ltvCacRatio >= 2.5) unitEconomics = 70;
  else if (ltvCacRatio >= 1.5) unitEconomics = 50;
  else unitEconomics = 30;

  // Payback period penalty
  if (input.paybackMonths > 18) unitEconomics -= 20;
  else if (input.paybackMonths > 12) unitEconomics -= 10;
  else if (input.paybackMonths <= 6) unitEconomics += 5;
  unitEconomics = Math.max(10, Math.min(100, unitEconomics));

  // 4. Technical Feasibility (20% weight)
  let technicalFeasibility = 80;
  // Lower score if high complexity or high regulatory risk
  technicalFeasibility -= (input.techComplexity - 1) * 7;
  technicalFeasibility -= (input.regulatoryRisk - 1) * 8;
  // Founder experience mitigation
  technicalFeasibility += Math.min(20, input.founderExperienceYears * 3);
  technicalFeasibility = Math.max(10, Math.min(100, technicalFeasibility));

  // Compute weighted overall score
  const overallScore = Math.round(
    marketDemand * 0.30 +
    competitorDensity * 0.25 +
    unitEconomics * 0.25 +
    technicalFeasibility * 0.20
  );

  let gradeBracket: 'A' | 'B' | 'C' | 'F' = 'F';
  if (overallScore >= 85) gradeBracket = 'A';
  else if (overallScore >= 70) gradeBracket = 'B';
  else if (overallScore >= 60) gradeBracket = 'C';
  else gradeBracket = 'F';

  const keyRisks: string[] = [];
  const recommendations: string[] = [];

  if (ltvCacRatio < 3.0) {
    keyRisks.push(`Sub-optimal LTV/CAC ratio (${ltvCacRatio.toFixed(1)}x). Target >= 3.0x for venture-scale SaaS.`);
    recommendations.push('Introduce annual upfront payment incentives to compress cash payback cycle.');
  }

  if (input.directCompetitorsCount > 8 && input.differentiationFactor < 4) {
    keyRisks.push('Red ocean market with crowded incumbents and modest differentiation.');
    recommendations.push('Carve an underserved vertical niche before attempting horizontal expansion.');
  }

  if (input.regulatoryRisk >= 4) {
    keyRisks.push('Elevated regulatory compliance exposure (fintech/healthcare/data sovereign).');
    recommendations.push('Implement automated compliance sandboxes and SOC2/HIPAA audit trails.');
  }

  let suggestedPivots: string[] | undefined;
  if (overallScore < 60) {
    suggestedPivots = [
      `Vertical SaaS Wedge: Shift from horizontal ${input.industry} to specialized workflow automation for top 5% high-LTV operators.`,
      `Headless API Infrastructure: Re-package core logic as an unbundled developer API, avoiding front-end CAC.`,
      `Outcome-Based Managed Service: Bundle software with autonomous agent execution, billing on performance rather than per-seat.`,
    ];
  }

  return {
    overallScore,
    gradeBracket,
    factorScores: {
      marketDemand,
      competitorDensity,
      unitEconomics,
      technicalFeasibility,
    },
    keyRisks,
    recommendations,
    suggestedPivots,
  };
}

export const graderRoutes = Router();

// In-memory lead capture repository
interface GraderLead {
  leadId: string;
  name: string;
  email: string;
  ventureName: string;
  industry: string;
  score: number;
  gradeBracket: string;
  createdAt: string;
}

const leads: GraderLead[] = [];

// POST /api/grader/score
graderRoutes.post('/score', (req: Request, res: Response) => {
  try {
    const input: GraderInput = {
      ventureName: req.body.ventureName || 'Untitled Venture',
      industry: req.body.industry || 'B2B SaaS',
      tamUsd: Number(req.body.tamUsd) || 500_000_000,
      samUsd: Number(req.body.samUsd) || 50_000_000,
      directCompetitorsCount: Number(req.body.directCompetitorsCount) || 3,
      differentiationFactor: Number(req.body.differentiationFactor) || 4,
      estimatedCacUsd: Number(req.body.estimatedCacUsd) || 250,
      estimatedLtvUsd: Number(req.body.estimatedLtvUsd) || 1200,
      paybackMonths: Number(req.body.paybackMonths) || 6,
      techComplexity: Number(req.body.techComplexity) || 2,
      regulatoryRisk: Number(req.body.regulatoryRisk) || 1,
      founderExperienceYears: Number(req.body.founderExperienceYears) || 4,
    };

    const result = calculateGraderScore(input);
    res.json({ input, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/grader/leads
graderRoutes.post('/leads', (req: Request, res: Response) => {
  const { name, email, ventureName, industry, score, gradeBracket } = req.body;

  if (!email || !name) {
    res.status(400).json({ error: 'Name and email are required for lead capture' });
    return;
  }

  const lead: GraderLead = {
    leadId: `lead_${randomUUID().slice(0, 8)}`,
    name,
    email,
    ventureName: ventureName || 'Untitled Venture',
    industry: industry || 'Software',
    score: score ?? 75,
    gradeBracket: gradeBracket || 'B',
    createdAt: new Date().toISOString(),
  };

  leads.push(lead);

  res.status(201).json({
    message: 'Lead captured successfully',
    leadId: lead.leadId,
    reportDownloadUrl: `/api/grader/reports/${lead.leadId}`,
  });
});

// GET /api/grader/leads
graderRoutes.get('/leads', (_req: Request, res: Response) => {
  res.json({ leads });
});
