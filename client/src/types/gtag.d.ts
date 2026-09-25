declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (command: 'js' | 'config' | 'event' | 'set' | 'consent', ...params: unknown[]) => void;
  }
}

export {};
