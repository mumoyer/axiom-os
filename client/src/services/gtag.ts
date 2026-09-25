/**
 * Google Tag (gtag.js) safe client helper service
 * Supports Google Ads conversion tracking and telemetry with graceful ad-blocker fallback
 */

export const GOOGLE_TAG_ID = 'AW-18468934435';

export function trackEvent(
  action: string,
  params?: Record<string, unknown>
): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', action, params);
    }
  } catch (err) {
    console.debug('[gtag] Event tracking omitted or blocked:', action, err);
  }
}

export function trackConversion(
  conversionLabel: string,
  value?: number,
  currency = 'USD',
  transactionId?: string
): void {
  trackEvent('conversion', {
    send_to: `${GOOGLE_TAG_ID}/${conversionLabel}`,
    value,
    currency,
    transaction_id: transactionId,
  });
}

/**
 * Reports a virtual page view for client-side SPA route transitions.
 * Entry page load is already handled by inline gtag('config') in index.html.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;

  trackEvent('page_view', {
    send_to: GOOGLE_TAG_ID,
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: pageTitle ?? document.title,
  });
}

