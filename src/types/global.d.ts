export {};

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    clarity?: any;
    gtag: (...args: any[]) => void;
  }
}
