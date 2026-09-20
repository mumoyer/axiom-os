/**
 * Venture Validation Grader (VVG) Pure Mathematical Engine
 * 
 * Implements the 4-factor scoring algorithm:
 * 1. Market Demand & TAM/SAM (Weight: 30%)
 * 2. Competitor Density & Differentiation (Weight: 25%)
 * 3. Unit Economics CAC/LTV & Payback (Weight: 25%)
 * 4. Technical Feasibility & Regulatory Risk (Weight: 20%)
 * 
 * Brackets:
 * - Grade A: 85 - 100 (Prime Venture Candidate)
 * - Grade B: 70 - 84  (High Viability)
 * - Grade C: 60 - 69  (Conditional Viability)
 * - Grade F: 0 - 59   (Capital Waste Warning -> Triggers 3 Automated Pivots)
 */

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

export interface FactorScores {
  marketDemand: number;
  competitorDensity: number;
  unitEconomics: number;
  technicalFeasibility: number;
}

export type GradeBracket = 'A' | 'B' | 'C' | 'F';

export interface GraderScoreResult {
  overallScore: number;
  gradeBracket: GradeBracket;
  factorScores: FactorScores;
  keyRisks: string[];
  recommendations: string[];
  suggestedPivots?: string[];
}

export const FACTOR_WEIGHTS = {
  marketDemand: 0.30,
  competitorDensity: 0.25,
  unitEconomics: 0.25,
  technicalFeasibility: 0.20,
} as const;

/**
 * Normalizes an addressable market dollar amount on a 0-100 logarithmic scale.
 * Floor at $1M, 100pts at >= $10B.
 */
export function normalizeMarketSize(dollars: number): number {
  if (dollars <= 0) return 0;
  if (dollars >= 10_000_000_000) return 100;
  if (dollars <= 1_000_000) return 10;
  // Logarithmic interpolation between 1M (10) and 10B (100)
  const logVal = Math.log10(dollars);
  const minLog = 6.0;  // 1M
  const maxLog = 10.0; // 10B
  const score = 10 + ((logVal - minLog) / (maxLog - minLog)) * 90;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 1. Market Demand Factor (30% weight)
 * Combines absolute TAM scale with SAM/TAM addressability ratio.
 */
export function calculateMarketDemand(tamUsd: number, samUsd: number): number {
  if (tamUsd <= 0) return 10;

  let baseScore = 50;
  if (tamUsd >= 10_000_000_000) {
    baseScore = 95;
  } else if (tamUsd >= 1_000_000_000) {
    baseScore = 85;
  } else if (tamUsd >= 100_000_000) {
    baseScore = 75;
  } else if (tamUsd >= 10_000_000) {
    baseScore = 60;
  } else {
    baseScore = 40;
  }

  // SAM / TAM validation bonus: healthy ratio is 5% to 35%
  const samRatio = samUsd > 0 ? samUsd / tamUsd : 0;
  if (samRatio >= 0.05 && samRatio <= 0.35) {
    baseScore += 5;
  } else if (samRatio > 0.60) {
    // Unrealistic SAM claim penalty
    baseScore -= 5;
  }

  return Math.max(10, Math.min(100, baseScore));
}

/**
 * 2. Competitor Density Factor (25% weight)
 * Inverted saturation curve with differentiation moat multiplier.
 */
export function calculateCompetitorDensity(
  directCompetitorsCount: number,
  differentiationFactor: number
): number {
  const safeCompetitors = Math.max(0, directCompetitorsCount);
  const safeDiff = Math.max(1, Math.min(5, differentiationFactor));

  let baseScore = 70;
  if (safeCompetitors <= 2) {
    baseScore = 90;
  } else if (safeCompetitors <= 5) {
    baseScore = 80;
  } else if (safeCompetitors <= 12) {
    baseScore = 65;
  } else {
    baseScore = 45;
  }

  // Differentiation bonus/penalty (-16 to +16)
  const diffAdjustment = (safeDiff - 3) * 8;
  baseScore += diffAdjustment;

  // Severe crowding penalty if > 25 competitors with weak differentiation
  if (safeCompetitors > 25 && safeDiff <= 2) {
    baseScore -= 15;
  }

  return Math.max(10, Math.min(100, baseScore));
}

/**
 * 3. Unit Economics Factor (25% weight)
 * Evaluates LTV:CAC efficiency and cash payback cycle speed.
 */
export function calculateUnitEconomics(
  estimatedCacUsd: number,
  estimatedLtvUsd: number,
  paybackMonths: number
): number {
  const safeCac = Math.max(0, estimatedCacUsd);
  const safeLtv = Math.max(0, estimatedLtvUsd);
  const safePayback = Math.max(1, paybackMonths);

  let ltvCacRatio = 1.0;
  if (safeCac === 0 && safeLtv > 0) {
    ltvCacRatio = 10.0; // Organic acquisition
  } else if (safeCac > 0) {
    ltvCacRatio = safeLtv / safeCac;
  }

  let score = 60;
  if (ltvCacRatio >= 5.0) {
    score = 95;
  } else if (ltvCacRatio >= 3.5) {
    score = 85;
  } else if (ltvCacRatio >= 2.5) {
    score = 70;
  } else if (ltvCacRatio >= 1.5) {
    score = 50;
  } else {
    score = 30;
  }

  // Payback period modifier
  if (safePayback > 18) {
    score -= 20;
  } else if (safePayback > 12) {
    score -= 10;
  } else if (safePayback <= 6) {
    score += 5;
  }

  return Math.max(10, Math.min(100, score));
}

/**
 * 4. Technical Feasibility Factor (20% weight)
 * Balances architectural complexity, regulatory friction, and founder track record.
 */
export function calculateTechnicalFeasibility(
  techComplexity: number,
  regulatoryRisk: number,
  founderExperienceYears: number
): number {
  const safeComplexity = Math.max(1, Math.min(5, techComplexity));
  const safeRegulatory = Math.max(1, Math.min(5, regulatoryRisk));
  const safeExperience = Math.max(0, founderExperienceYears);

  let score = 80;

  // Deductions for technical friction
  score -= (safeComplexity - 1) * 7;

  // Deductions for regulatory/compliance friction
  score -= (safeRegulatory - 1) * 8;

  // Founder domain experience mitigation (+0 to +20)
  const experienceBonus = Math.min(20, safeExperience * 3);
  score += experienceBonus;

  return Math.max(10, Math.min(100, score));
}

/**
 * Maps composite score into institutional Grade Brackets:
 * Grade A (85-100), Grade B (70-84), Grade C (60-69), Grade F (0-59)
 */
export function getGradeBracket(overallScore: number): GradeBracket {
  if (overallScore >= 85) return 'A';
  if (overallScore >= 70) return 'B';
  if (overallScore >= 60) return 'C';
  return 'F';
}

/**
 * Synthesizes 3 validated strategic pivots for low-scoring ventures (< 60)
 */
export function generatePivots(industry: string, ventureName: string): string[] {
  const cleanIndustry = industry?.trim() || 'SaaS';
  const cleanName = ventureName?.trim() || 'This venture';

  return [
    `Vertical SaaS Wedge: Shift ${cleanName} from horizontal ${cleanIndustry} to specialized workflow automation for top 5% high-LTV enterprise operators.`,
    `Headless API Infrastructure: Re-package core algorithms as an unbundled developer API, bypassing consumer CAC and monetizing API usage volume.`,
    `Outcome-Based Managed Service: Bundle software with autonomous agent execution, billing on guaranteed business outcomes rather than commoditized seats.`,
  ];
}

/**
 * Validates raw user input fields with actionable error diagnostics
 */
export function validateGraderInput(input: Partial<GraderInput>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.ventureName || input.ventureName.trim().length < 2) {
    errors.push('Venture name must be at least 2 characters.');
  }

  if (input.tamUsd !== undefined && input.tamUsd < 0) {
    errors.push('Total Addressable Market (TAM) cannot be negative.');
  }

  if (input.samUsd !== undefined && input.tamUsd !== undefined && input.samUsd > input.tamUsd) {
    errors.push('Serviceable Addressable Market (SAM) cannot exceed TAM.');
  }

  if (input.directCompetitorsCount !== undefined && input.directCompetitorsCount < 0) {
    errors.push('Competitor count cannot be negative.');
  }

  if (input.differentiationFactor !== undefined && (input.differentiationFactor < 1 || input.differentiationFactor > 5)) {
    errors.push('Differentiation factor must be between 1 and 5.');
  }

  if (input.estimatedCacUsd !== undefined && input.estimatedCacUsd < 0) {
    errors.push('Estimated CAC cannot be negative.');
  }

  if (input.estimatedLtvUsd !== undefined && input.estimatedLtvUsd < 0) {
    errors.push('Estimated LTV cannot be negative.');
  }

  if (input.paybackMonths !== undefined && input.paybackMonths < 1) {
    errors.push('Payback period must be at least 1 month.');
  }

  if (input.techComplexity !== undefined && (input.techComplexity < 1 || input.techComplexity > 5)) {
    errors.push('Technical complexity must be between 1 and 5.');
  }

  if (input.regulatoryRisk !== undefined && (input.regulatoryRisk < 1 || input.regulatoryRisk > 5)) {
    errors.push('Regulatory risk must be between 1 and 5.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Master calculation function evaluating all 4 factors and generating full report
 */
export function calculateGraderScore(input: GraderInput): GraderScoreResult {
  const marketDemand = calculateMarketDemand(input.tamUsd, input.samUsd);
  const competitorDensity = calculateCompetitorDensity(input.directCompetitorsCount, input.differentiationFactor);
  const unitEconomics = calculateUnitEconomics(input.estimatedCacUsd, input.estimatedLtvUsd, input.paybackMonths);
  const technicalFeasibility = calculateTechnicalFeasibility(input.techComplexity, input.regulatoryRisk, input.founderExperienceYears);

  // Exact mathematical weighting
  const overallScore = Math.round(
    marketDemand * FACTOR_WEIGHTS.marketDemand +
    competitorDensity * FACTOR_WEIGHTS.competitorDensity +
    unitEconomics * FACTOR_WEIGHTS.unitEconomics +
    technicalFeasibility * FACTOR_WEIGHTS.technicalFeasibility
  );

  const gradeBracket = getGradeBracket(overallScore);

  const keyRisks: string[] = [];
  const recommendations: string[] = [];

  const ltvCacRatio = input.estimatedCacUsd > 0 ? input.estimatedLtvUsd / input.estimatedCacUsd : 1.0;
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

  if (input.paybackMonths > 12) {
    keyRisks.push(`Extended payback cycle (${input.paybackMonths} months) strains operational cash runway.`);
    recommendations.push('Shift to monthly credit drawdown or usage billing to accelerate cash collections.');
  }

  if (input.tamUsd < 50_000_000) {
    keyRisks.push('Niche TAM ceiling may cap long-term enterprise valuation growth.');
    recommendations.push('Identify adjacent secondary markets to expand TAM post-PMF.');
  }

  let suggestedPivots: string[] | undefined;
  if (overallScore < 60) {
    suggestedPivots = generatePivots(input.industry, input.ventureName);
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
