/**
 * Typed API Client for Stage Gate OS Backend Services
 * Connects frontend UI to Express endpoints on port 3000 (proxied via Vite)
 */

import { GraderInput, GraderScoreResult, calculateGraderScore } from './grader.js';

export interface LeadCapturePayload {
  name: string;
  email: string;
  ventureName?: string;
  industry?: string;
  score?: number;
  gradeBracket?: string;
}

export interface LeadCaptureResponse {
  message: string;
  leadId: string;
  reportDownloadUrl: string;
}

export interface CheckoutTier {
  id: string;
  name: string;
  priceUsd: number;
  listPriceUsd?: number;
  billing: string;
  savingsUsd?: number;
  discountPercent?: number;
  monthly?: any;
  annual?: any;
}

export interface CheckoutConfigResponse {
  sandboxMode: boolean;
  publishableKey: string;
  organization?: string;
  beta?: {
    active: boolean;
    label: string;
    badgeText: string;
    discountPercent: number;
    endsOn: string;
    lifetimeLockIn: boolean;
    explanation: string;
    bugBounty: {
      rewards: {
        cosmetic: string;
        functional: string;
        blocking: string;
        security: string;
      };
      promise: string;
      encouragement: string;
    };
  };
  shopifyIntegration?: {
    enabled: boolean;
    shopDomain: string;
    shopPayEnabled: boolean;
    checkoutMode: string;
  };
  supportedTiers: CheckoutTier[];
}

export interface CreateCheckoutSessionPayload {
  plan: 'FOUNDER' | 'SERIAL' | 'ENTERPRISE';
  email: string;
  billingInterval?: 'monthly' | 'annual';
  successUrl?: string;
  cancelUrl?: string;
  ventureId?: string;
  paymentProvider?: 'Shopify / Shop Pay' | 'Stripe' | 'Sandbox';
  agreedToTerms?: boolean;
  consentTimestamp?: string;
  disclosureVersion?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
  customer: {
    id: string;
    email: string;
  };
  plan: string;
  amountUsd?: number;
  listPriceUsd?: number;
  isBetaDiscountApplied?: boolean;
}

export interface SubmitBugPayload {
  title: string;
  description: string;
  category: string;
  severity: string;
  reporterEmail?: string;
  ventureId?: string;
  url?: string;
  systemInfo?: Record<string, any>;
}

export interface SubmitBugResponse {
  success: boolean;
  bugId: string;
  bountyReward: string;
  message: string;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  database: string;
  timestamp: string;
  engine: string;
}

const API_BASE = '/api';

/**
 * Generic fetch wrapper with JSON parsing and standardized error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson?.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // Fallback to HTTP statusText
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[Stage Gate OS API] Call to ${url} failed:`, err.message);
    throw err;
  }
}

/**
 * Grader: Calculate score via backend (with fallback to client-side pure mathematical engine)
 */
export async function calculateGraderScoreRemote(input: GraderInput): Promise<{ input: GraderInput; result: GraderScoreResult }> {
  try {
    return await apiFetch<{ input: GraderInput; result: GraderScoreResult }>('/grader/score', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    // Graceful offline/standalone fallback using client-side mathematical engine
    const result = calculateGraderScore(input);
    return { input, result };
  }
}

/**
 * Grader: Capture prospective founder lead
 */
export async function captureLead(payload: LeadCapturePayload): Promise<LeadCaptureResponse> {
  return await apiFetch<LeadCaptureResponse>('/grader/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Checkout: Fetch Stripe sandbox config & supported tiers
 */
export async function getCheckoutConfig(): Promise<CheckoutConfigResponse> {
  try {
    return await apiFetch<CheckoutConfigResponse>('/checkout/config');
  } catch {
    return {
      sandboxMode: true,
      publishableKey: 'pk_test_stagegate_sandbox_public_key',
      organization: 'Moyer Ventures LLC',
      beta: {
        active: true,
        label: 'BETA',
        badgeText: '20% BETA DISCOUNT',
        discountPercent: 20,
        endsOn: '2026-12-31',
        lifetimeLockIn: true,
        explanation:
          'You are an early adopter. Beta pricing is our trade: you get 20% off regular list price, and in return we ask you to report any bugs or rough edges you encounter. Subscribe during beta and your rate is locked for life.',
        bugBounty: {
          rewards: {
            cosmetic: 'Beta Tester Credit in Release Notes',
            functional: '1 Free Month',
            blocking: '2 Free Months',
            security: '3 Free Months + Direct Founder Advisory Line',
          },
          promise: 'Every report is reviewed within 24 hours.',
          encouragement: 'Help us make Stage Gate OS unbreakable! Found an error or edge case? Report it and get rewarded.',
        },
      },
      shopifyIntegration: {
        enabled: true,
        shopDomain: 'z0zt1m-ae.myshopify.com',
        shopPayEnabled: true,
        checkoutMode: 'Shopify / Shop Pay (Moyer Ventures LLC)',
      },
      supportedTiers: [
        {
          id: 'FOUNDER',
          name: 'Founder Plan',
          priceUsd: 55.0,
          listPriceUsd: 69.0,
          savingsUsd: 14.0,
          discountPercent: 20,
          billing: 'monthly',
          shopifyProductId: '7741406576774',
          shopifyCheckoutUrl: 'https://www.stagegateos.com/subscribe/founder',
        },
        {
          id: 'SERIAL',
          name: 'Serial Entrepreneur Plan',
          priceUsd: 119.0,
          listPriceUsd: 149.0,
          savingsUsd: 30.0,
          discountPercent: 20,
          billing: 'monthly',
          shopifyProductId: '7741407199366',
          shopifyCheckoutUrl: 'https://www.stagegateos.com/subscribe/serial',
        },
        {
          id: 'ENTERPRISE',
          name: 'Enterprise Studio Plan',
          priceUsd: 799.0,
          listPriceUsd: 999.0,
          savingsUsd: 200.0,
          discountPercent: 20,
          billing: 'monthly',
          shopifyProductId: '7741407723654',
          shopifyCheckoutUrl: 'https://www.stagegateos.com/subscribe/enterprise',
        },
      ],
    };
  }
}

/**
 * Checkout: Create Stripe checkout session
 */
export async function createCheckoutSession(
  payload: CreateCheckoutSessionPayload
): Promise<CheckoutSessionResponse> {
  return await apiFetch<CheckoutSessionResponse>('/checkout/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Feedback: Submit a bug report for beta bounty
 */
export async function submitBugReport(payload: SubmitBugPayload): Promise<SubmitBugResponse> {
  return await apiFetch<SubmitBugResponse>('/feedback/bug', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Feedback: Get bug bounty terms and rewards config
 */
export async function getFeedbackConfig(): Promise<any> {
  return await apiFetch<any>('/feedback/config');
}

/**
 * Health: Query container & gate health status
 */
export async function getSystemHealth(): Promise<HealthResponse> {
  try {
    return await apiFetch<HealthResponse>('/healthz');
  } catch {
    return {
      status: 'offline',
      uptime: 0,
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      engine: 'Stage Gate OS (Offline)',
    };
  }
}

/**
 * In-Product Messaging: Types and API calls
 */
export interface ApiProjectMessage {
  id: string;
  ventureId: string;
  sender: 'customer' | 'admin';
  senderName: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export async function fetchProjectMessages(ventureId: string): Promise<ApiProjectMessage[]> {
  const data = await apiFetch<{ ventureId: string; messages: ApiProjectMessage[] }>(`/messages/${ventureId}`);
  return data.messages || [];
}

export async function sendProjectMessage(
  ventureId: string,
  payload: { text: string; sender: 'customer' | 'admin'; senderName?: string; senderEmail?: string }
): Promise<ApiProjectMessage> {
  const res = await apiFetch<{ message: string; data: ApiProjectMessage }>(`/messages/${ventureId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/**
 * Passwordless Authentication Types & Methods
 */
export interface AuthUser {
  email: string;
  tenantId: string;
  role: 'founder' | 'admin';
  createdAt: string;
}

export interface AuthSessionData {
  sessionToken: string;
  email: string;
  tenantId: string;
  role: 'founder' | 'admin';
  createdAt: string;
  expiresAt: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
  email: string;
  previewOtp?: string;
  magicLinkUrl?: string;
  expiresAt: string;
}

export interface VerifyAuthResponse {
  success: boolean;
  session?: AuthSessionData;
  error?: string;
  remainingAttempts?: number;
}

export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  return await apiFetch<MagicLinkResponse>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyAuthOtp(email: string, otp: string): Promise<VerifyAuthResponse> {
  return await apiFetch<VerifyAuthResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function verifyAuthToken(token: string): Promise<VerifyAuthResponse> {
  return await apiFetch<VerifyAuthResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function getAuthProfile(token: string): Promise<{ authenticated: boolean; user: AuthUser }> {
  return await apiFetch<{ authenticated: boolean; user: AuthUser }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logoutAuth(token: string): Promise<{ success: boolean }> {
  return await apiFetch<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
