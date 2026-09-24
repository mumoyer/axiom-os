/**
 * Single Source of Truth for Stage Gate OS Pricing & Public Beta Program
 * 
 * Shared between Server (API / Stripe / Notifications) and Client (Landing, Pricing, Checkout)
 */

export type TierId = 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
export type BillingInterval = 'monthly' | 'annual';

export interface BugBountyConfig {
  rewards: {
    cosmetic: string;
    functional: string;
    blocking: string;
    security: string;
  };
  promise: string;
  encouragement: string;
}

export interface BetaConfig {
  active: boolean;
  label: string;
  badgeText: string;
  discountPercent: number;
  endsOn: string;
  lifetimeLockIn: boolean;
  explanation: string;
  bugBounty: BugBountyConfig;
}

export const BETA_CONFIG: BetaConfig = {
  active: true,
  label: 'BETA',
  badgeText: '20% BETA DISCOUNT',
  discountPercent: 20,
  endsOn: '2026-12-31',
  lifetimeLockIn: true,
  explanation:
    'You are an early adopter. Beta pricing is our trade: you get 20% off regular list price, and in return we ask you to report any bugs or rough edges you encounter. Subscribe during beta and your discounted rate is locked for the lifetime of your active subscription — it will never rise to list price.',
  bugBounty: {
    rewards: {
      cosmetic: 'Beta Tester Credit in Release Notes',
      functional: '1 Free Month',
      blocking: '2 Free Months',
      security: '3 Free Months + Direct Founder Advisory Line',
    },
    promise: 'Every report is directly reviewed by Jason Moyer and engineering within 24 hours.',
    encouragement:
      'Help us make Stage Gate OS completely unbreakable! There is no report too small, and you will never be penalized for a duplicate or false alarm. Found a glitch, slow gate, or unexpected error? Tell us and get rewarded.',
  },
};

export interface TierDefinition {
  id: TierId;
  name: string;
  persona: string;
  subtitle: string;
  listMonthlyPrice: number;
  listAnnualPrice: number;
  listMonthlyPerMo: number;
  listAnnualPerMo: number;
  betaMonthlyPrice: number;
  betaAnnualPrice: number;
  betaMonthlyPerMo: number;
  betaAnnualPerMo: number;
  shopifyProductId: string;
  shopifyCheckoutUrl: string;
  deployments: number;
  iterations: number;
  credits: number;
  byok: boolean;
}

export const PRICING_TIERS: Record<TierId, TierDefinition> = {
  FOUNDER: {
    id: 'FOUNDER',
    name: 'Founder Plan',
    persona: 'Busy 9-to-5 Professionals',
    subtitle: 'Turnkey 15 min/day, no coding needed, personal GitHub & Stripe',
    listMonthlyPrice: 69,
    listAnnualPrice: 660,
    listMonthlyPerMo: 69,
    listAnnualPerMo: 55,
    betaMonthlyPrice: 55,
    betaAnnualPrice: 528,
    betaMonthlyPerMo: 55,
    betaAnnualPerMo: 44,
    shopifyProductId: '7741406576774',
    shopifyCheckoutUrl: 'https://www.stagegateos.com/subscribe/founder',
    deployments: 3,
    iterations: 10,
    credits: 1000,
    byok: false,
  },
  SERIAL: {
    id: 'SERIAL',
    name: 'Serial Plan',
    persona: 'Serial Indie Hackers & Builders',
    subtitle: 'Headless CLI, BYOK 0% token markup, multi-venture cockpit',
    listMonthlyPrice: 149,
    listAnnualPrice: 1430,
    listMonthlyPerMo: 149,
    listAnnualPerMo: 119,
    betaMonthlyPrice: 119,
    betaAnnualPrice: 1140,
    betaMonthlyPerMo: 119,
    betaAnnualPerMo: 95,
    shopifyProductId: '7741407199366',
    shopifyCheckoutUrl: 'https://www.stagegateos.com/subscribe/serial',
    deployments: 15,
    iterations: 50,
    credits: 5000,
    byok: true,
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Studio Plan',
    persona: 'Corporate Innovation Studios',
    subtitle: 'Tranche capital gates ($5k→$25k→$100k), SAML SSO, SOC 2 ready controls',
    listMonthlyPrice: 999,
    listAnnualPrice: 9590,
    listMonthlyPerMo: 999,
    listAnnualPerMo: 799,
    betaMonthlyPrice: 799,
    betaAnnualPrice: 7668,
    betaMonthlyPerMo: 799,
    betaAnnualPerMo: 639,
    shopifyProductId: '7741407723654',
    shopifyCheckoutUrl: 'https://www.stagegateos.com/subscribe/enterprise',
    deployments: 50,
    iterations: 250,
    credits: 25000,
    byok: true,
  },
};

export interface PricingCalculation {
  priceUsd: number;
  listPriceUsd: number;
  perMonthUsd: number;
  listPerMonthUsd: number;
  savingsUsd: number;
  discountPercent: number;
  isBetaApplied: boolean;
}

export function calculatePricing(
  tierId: TierId,
  interval: BillingInterval = 'monthly',
  isBeta: boolean = BETA_CONFIG.active
): PricingCalculation {
  const tier = PRICING_TIERS[tierId] || PRICING_TIERS.FOUNDER;

  if (isBeta) {
    if (interval === 'annual') {
      const priceUsd = tier.betaAnnualPrice;
      const listPriceUsd = tier.listAnnualPrice;
      const perMonthUsd = tier.betaAnnualPerMo;
      const listPerMonthUsd = tier.listAnnualPerMo;
      const savingsUsd = listPriceUsd - priceUsd;
      const discountPercent = Math.round(((listPriceUsd - priceUsd) / listPriceUsd) * 100);
      return {
        priceUsd,
        listPriceUsd,
        perMonthUsd,
        listPerMonthUsd,
        savingsUsd,
        discountPercent,
        isBetaApplied: true,
      };
    } else {
      const priceUsd = tier.betaMonthlyPrice;
      const listPriceUsd = tier.listMonthlyPrice;
      const perMonthUsd = tier.betaMonthlyPerMo;
      const listPerMonthUsd = tier.listMonthlyPerMo;
      const savingsUsd = listPriceUsd - priceUsd;
      const discountPercent = Math.round(((listPriceUsd - priceUsd) / listPriceUsd) * 100);
      return {
        priceUsd,
        listPriceUsd,
        perMonthUsd,
        listPerMonthUsd,
        savingsUsd,
        discountPercent,
        isBetaApplied: true,
      };
    }
  } else {
    // List pricing
    if (interval === 'annual') {
      const priceUsd = tier.listAnnualPrice;
      const listPriceUsd = tier.listAnnualPrice;
      const perMonthUsd = tier.listAnnualPerMo;
      const listPerMonthUsd = tier.listAnnualPerMo;
      return {
        priceUsd,
        listPriceUsd,
        perMonthUsd,
        listPerMonthUsd,
        savingsUsd: 0,
        discountPercent: 0,
        isBetaApplied: false,
      };
    } else {
      const priceUsd = tier.listMonthlyPrice;
      const listPriceUsd = tier.listMonthlyPrice;
      const perMonthUsd = tier.listMonthlyPerMo;
      const listPerMonthUsd = tier.listMonthlyPerMo;
      return {
        priceUsd,
        listPriceUsd,
        perMonthUsd,
        listPerMonthUsd,
        savingsUsd: 0,
        discountPercent: 0,
        isBetaApplied: false,
      };
    }
  }
}

export function getTierConfig(tierId: TierId) {
  return PRICING_TIERS[tierId] || PRICING_TIERS.FOUNDER;
}
