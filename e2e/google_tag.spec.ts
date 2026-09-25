import { test, expect } from '@playwright/test';

const GOOGLE_TAG_ID = 'AW-18468934435';

test.describe('Google Tag (AW-18468934435) Runtime E2E Suite', () => {
  test('Single-Page App (/): initializes gtag loader, dataLayer, and config call', async ({ page }) => {
    const loaderRequests: string[] = [];

    // Monitor outbound network requests for gtag loader
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('googletagmanager.com/gtag/js')) {
        loaderRequests.push(url);
      }
    });

    await page.goto('/');

    // Verify DOM structure: exactly one script tag in head with correct source
    const scriptElements = await page.locator('head > script[src*="googletagmanager.com/gtag/js"]').all();
    expect(scriptElements.length).toBe(1);

    const scriptSrc = await scriptElements[0].getAttribute('src');
    expect(scriptSrc).toContain(`id=${GOOGLE_TAG_ID}`);

    // Verify window.dataLayer existence and initialization
    const dataLayerLength = await page.evaluate(() => {
      return (window as any).dataLayer && Array.isArray((window as any).dataLayer)
        ? (window as any).dataLayer.length
        : -1;
    });
    expect(dataLayerLength).toBeGreaterThan(0);

    // Verify window.gtag function is available
    const hasGtagFn = await page.evaluate(() => typeof (window as any).gtag === 'function');
    expect(hasGtagFn).toBe(true);
  });

  test('Brand Assets Static Page (/brand/): contains Google Tag script and initializes dataLayer', async ({ page }) => {
    await page.goto('/brand/');

    const scriptElements = await page.locator('head > script[src*="googletagmanager.com/gtag/js"]').all();
    expect(scriptElements.length).toBe(1);

    const scriptSrc = await scriptElements[0].getAttribute('src');
    expect(scriptSrc).toContain(`id=${GOOGLE_TAG_ID}`);

    const hasDataLayer = await page.evaluate(() => {
      return Array.isArray((window as any).dataLayer);
    });
    expect(hasDataLayer).toBe(true);
  });

  test('In-app navigation: dispatches virtual page_view event on client-side route change', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);

    // Navigate to /grader via hash
    await page.evaluate(() => {
      window.location.hash = '/grader';
    });
    await page.waitForTimeout(300);

    // Verify dataLayer contains page_view event for /grader
    const pageViewEvents = await page.evaluate(() => {
      const dl = (window as any).dataLayer || [];
      return dl.filter((entry: any) => {
        if (entry && entry[0] === 'event' && entry[1] === 'page_view') {
          return true;
        }
        return false;
      });
    });

    expect(pageViewEvents.length).toBeGreaterThanOrEqual(1);
    const lastPageView = pageViewEvents[pageViewEvents.length - 1];
    expect(lastPageView[2].page_path).toBe('/grader');
    expect(lastPageView[2].send_to).toBe(GOOGLE_TAG_ID);
  });
});

