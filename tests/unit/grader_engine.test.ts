/**
 * Unit Test Suite: Venture Validation Grader (VVG) Mathematical Engine
 * 
 * Verifies:
 * - Happy path Grade A/B/C/F scoring calculations
 * - 4-Factor weighting: Demand (30%), Competitors (25%), Unit Econ (25%), Feasibility (20%)
 * - Boundary conditions: Zero TAM, extreme TAM, 0 competitors, saturated market (50+ competitors)
 * - Zero CAC handling (safe division), extreme LTV/CAC ratios
 * - Tech complexity and regulatory risk deductions
 * - Founder experience mitigation caps
 * - Automated Pivot Generator triggers exclusively when score < 60
 * - Input validation rules and diagnostic errors
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGraderScore,
  calculateMarketDemand,
  calculateCompetitorDensity,
  calculateUnitEconomics,
  calculateTechnicalFeasibility,
  getGradeBracket,
  generatePivots,
  validateGraderInput,
  FACTOR_WEIGHTS,
  GraderInput,
} from '../../client/src/services/grader.js';

describe('Venture Validation Grader (VVG) Unit Tests', () => {
  const strongVenture: GraderInput = {
    ventureName: 'AeroCloud Analytics',
    industry: 'Cloud Infrastructure',
    tamUsd: 15_000_000_000,
    samUsd: 1_200_000_000,
    directCompetitorsCount: 2,
    differentiationFactor: 5,
    estimatedCacUsd: 200,
    estimatedLtvUsd: 1800,
    paybackMonths: 4,
    techComplexity: 3,
    regulatoryRisk: 1,
    founderExperienceYears: 8,
  };

  const weakVenture: GraderInput = {
    ventureName: 'Crowded Me-Too App',
    industry: 'Food Delivery',
    tamUsd: 5_000_000,
    samUsd: 200_000,
    directCompetitorsCount: 30,
    differentiationFactor: 1,
    estimatedCacUsd: 500,
    estimatedLtvUsd: 400,
    paybackMonths: 24,
    techComplexity: 4,
    regulatoryRisk: 4,
    founderExperienceYears: 0,
  };

  describe('Factor 1: Market Demand (30% weight)', () => {
    it('awards 95-100 pts for mega-scale TAM >= $10B with healthy SAM ratio', () => {
      const score = calculateMarketDemand(15_000_000_000, 1_500_000_000);
      assert.ok(score >= 95 && score <= 100);
    });

    it('awards 85-90 pts for $1B-$10B TAM', () => {
      const score = calculateMarketDemand(2_500_000_000, 250_000_000);
      assert.ok(score >= 85 && score <= 90);
    });

    it('awards 75-80 pts for $100M-$1B TAM', () => {
      const score = calculateMarketDemand(500_000_000, 50_000_000);
      assert.ok(score >= 75 && score <= 80);
    });

    it('penalizes sub-$10M micro-niche TAM', () => {
      const score = calculateMarketDemand(5_000_000, 500_000);
      assert.ok(score <= 45);
    });

    it('handles zero or negative TAM gracefully without NaN', () => {
      const scoreZero = calculateMarketDemand(0, 0);
      const scoreNeg = calculateMarketDemand(-100_000, 0);
      assert.equal(scoreZero, 10);
      assert.equal(scoreNeg, 10);
      assert.ok(!Number.isNaN(scoreZero));
      assert.ok(!Number.isNaN(scoreNeg));
    });

    it('penalizes unrealistic SAM claims (> 60% of TAM)', () => {
      const normalScore = calculateMarketDemand(100_000_000, 20_000_000); // 20%
      const overclaimedScore = calculateMarketDemand(100_000_000, 90_000_000); // 90%
      assert.ok(normalScore > overclaimedScore);
    });
  });

  describe('Factor 2: Competitor Density & Differentiation (25% weight)', () => {
    it('awards top score for blue ocean (<= 2 competitors) with high differentiation', () => {
      const score = calculateCompetitorDensity(1, 5);
      assert.ok(score >= 90 && score <= 100);
    });

    it('heavily penalizes saturated market (>25 competitors) with clone differentiation (1)', () => {
      const score = calculateCompetitorDensity(35, 1);
      assert.ok(score <= 25);
    });

    it('rewards strong differentiation moat even in moderately crowded markets', () => {
      const lowDiff = calculateCompetitorDensity(8, 2);
      const highDiff = calculateCompetitorDensity(8, 5);
      assert.ok(highDiff > lowDiff);
      assert.equal(highDiff - lowDiff, 24); // (5-2)*8
    });

    it('clamps score within bounds [10, 100]', () => {
      const extremeCrowded = calculateCompetitorDensity(100, 1);
      const extremeEmpty = calculateCompetitorDensity(0, 5);
      assert.ok(extremeCrowded >= 10);
      assert.ok(extremeEmpty <= 100);
    });
  });

  describe('Factor 3: Unit Economics & Payback (25% weight)', () => {
    it('awards 95-100 pts for venture-scale LTV:CAC >= 5.0 with rapid payback <= 6 mo', () => {
      const score = calculateUnitEconomics(200, 1800, 4); // 9.0x ratio, 4 mo
      assert.equal(score, 100); // 95 + 5 bonus
    });

    it('awards 85 pts for 3.5 <= LTV:CAC < 5.0', () => {
      const score = calculateUnitEconomics(100, 400, 9); // 4.0x ratio, 9 mo
      assert.equal(score, 85);
    });

    it('awards 70 pts for 2.5 <= LTV:CAC < 3.5', () => {
      const score = calculateUnitEconomics(100, 300, 10); // 3.0x ratio
      assert.equal(score, 70);
    });

    it('penalizes underwater economics (LTV:CAC < 1.5) with long payback (> 18 mo)', () => {
      const score = calculateUnitEconomics(500, 400, 24); // 0.8x ratio, 24 mo
      assert.equal(score, 10); // 30 - 20 = 10 (min clamp)
    });

    it('handles zero CAC without division by zero errors', () => {
      const score = calculateUnitEconomics(0, 500, 6);
      assert.ok(!Number.isNaN(score));
      assert.ok(score >= 95);
    });
  });

  describe('Factor 4: Technical Feasibility & Regulatory Risk (20% weight)', () => {
    it('awards high score for low complexity, low regulatory risk, and experienced founder', () => {
      const score = calculateTechnicalFeasibility(1, 1, 5); // Simple, no reg, 5 yrs exp
      assert.equal(score, 95); // 80 - 0 - 0 + 15
    });

    it('deducts points for high technical complexity and high regulatory risk', () => {
      const score = calculateTechnicalFeasibility(5, 5, 0); // Complex (5), Reg (5), 0 exp
      // 80 - 4*7 - 4*8 + 0 = 80 - 28 - 32 = 20
      assert.equal(score, 20);
    });

    it('caps founder experience mitigation at +20 points max', () => {
      const score10yr = calculateTechnicalFeasibility(3, 1, 10); // 10*3 = 30 -> capped at 20
      const score20yr = calculateTechnicalFeasibility(3, 1, 20); // 20*3 = 60 -> capped at 20
      assert.equal(score10yr, score20yr);
    });
  });

  describe('Mathematical Weighting & Overall Composite Score', () => {
    it('verifies exact mathematical weights sum to 1.00', () => {
      const totalWeight =
        FACTOR_WEIGHTS.marketDemand +
        FACTOR_WEIGHTS.competitorDensity +
        FACTOR_WEIGHTS.unitEconomics +
        FACTOR_WEIGHTS.technicalFeasibility;
      assert.equal(Number(totalWeight.toFixed(2)), 1.00);
      assert.equal(FACTOR_WEIGHTS.marketDemand, 0.30);
      assert.equal(FACTOR_WEIGHTS.competitorDensity, 0.25);
      assert.equal(FACTOR_WEIGHTS.unitEconomics, 0.25);
      assert.equal(FACTOR_WEIGHTS.technicalFeasibility, 0.20);
    });

    it('calculates Grade A (>= 85) for strong institutional venture candidate', () => {
      const result = calculateGraderScore(strongVenture);
      assert.ok(result.overallScore >= 85);
      assert.equal(result.gradeBracket, 'A');
      assert.equal(result.suggestedPivots, undefined);
      assert.ok(result.recommendations.length >= 0);
    });

    it('calculates Grade B (70 - 84) for high-viability venture with minor optimizations', () => {
      const viableVenture: GraderInput = {
        ...strongVenture,
        tamUsd: 800_000_000,
        estimatedCacUsd: 300,
        estimatedLtvUsd: 1000, // ~3.3x
        directCompetitorsCount: 6,
        differentiationFactor: 3,
      };
      const result = calculateGraderScore(viableVenture);
      assert.ok(result.overallScore >= 70 && result.overallScore < 85);
      assert.equal(result.gradeBracket, 'B');
      assert.equal(result.suggestedPivots, undefined);
    });

    it('calculates Grade C (60 - 69) for conditional viability', () => {
      const conditionalVenture: GraderInput = {
        ...strongVenture,
        tamUsd: 200_000_000,
        samUsd: 20_000_000,
        directCompetitorsCount: 8,
        differentiationFactor: 3,
        estimatedCacUsd: 300,
        estimatedLtvUsd: 600, // 2.0x ratio (50 pts)
        paybackMonths: 10,
        techComplexity: 4,
        regulatoryRisk: 3,
        founderExperienceYears: 3,
      };
      const result = calculateGraderScore(conditionalVenture);
      assert.ok(result.overallScore >= 60 && result.overallScore < 70);
      assert.equal(result.gradeBracket, 'C');
      assert.equal(result.suggestedPivots, undefined);
    });

    it('calculates Grade F (< 60) and triggers Automated Pivot Generator for weak venture', () => {
      const result = calculateGraderScore(weakVenture);
      assert.ok(result.overallScore < 60);
      assert.equal(result.gradeBracket, 'F');
      assert.ok(Array.isArray(result.suggestedPivots));
      assert.equal(result.suggestedPivots.length, 3);
      assert.ok(result.suggestedPivots[0].includes('Vertical SaaS Wedge'));
      assert.ok(result.suggestedPivots[1].includes('Headless API Infrastructure'));
      assert.ok(result.suggestedPivots[2].includes('Outcome-Based Managed Service'));
    });
  });

  describe('Grade Bracket Thresholds', () => {
    it('correctly brackets edge values', () => {
      assert.equal(getGradeBracket(100), 'A');
      assert.equal(getGradeBracket(85), 'A');
      assert.equal(getGradeBracket(84), 'B');
      assert.equal(getGradeBracket(70), 'B');
      assert.equal(getGradeBracket(69), 'C');
      assert.equal(getGradeBracket(60), 'C');
      assert.equal(getGradeBracket(59), 'F');
      assert.equal(getGradeBracket(0), 'F');
    });
  });

  describe('Automated Pivot Generator', () => {
    it('generates 3 structured pivots including industry and venture context', () => {
      const pivots = generatePivots('Healthcare', 'MedPulse');
      assert.equal(pivots.length, 3);
      assert.ok(pivots[0].includes('Healthcare'));
      assert.ok(pivots[0].includes('MedPulse'));
      assert.ok(pivots[1].includes('Headless API'));
      assert.ok(pivots[2].includes('Outcome-Based'));
    });

    it('handles empty or missing industry fallback gracefully', () => {
      const pivots = generatePivots('', '');
      assert.equal(pivots.length, 3);
      assert.ok(pivots[0].includes('SaaS'));
    });
  });

  describe('Input Validation Rules', () => {
    it('accepts valid complete input', () => {
      const validation = validateGraderInput(strongVenture);
      assert.equal(validation.isValid, true);
      assert.equal(validation.errors.length, 0);
    });

    it('rejects venture names under 2 characters', () => {
      const validation = validateGraderInput({ ...strongVenture, ventureName: ' ' });
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.some((e) => e.includes('Venture name')));
    });

    it('rejects negative numbers and out-of-range factors', () => {
      const validation = validateGraderInput({
        ventureName: 'Valid Name',
        tamUsd: -500,
        samUsd: 1000,
        directCompetitorsCount: -3,
        differentiationFactor: 6,
        techComplexity: 0,
        regulatoryRisk: 10,
      });
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.length >= 4);
    });

    it('rejects SAM > TAM', () => {
      const validation = validateGraderInput({
        ventureName: 'Market Inversion',
        tamUsd: 1_000_000,
        samUsd: 5_000_000,
      });
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.some((e) => e.includes('SAM')));
    });
  });
});
