declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export function firePurchaseEvent(value: number, currency: string = "USD") {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "Purchase", { value, currency });
}
