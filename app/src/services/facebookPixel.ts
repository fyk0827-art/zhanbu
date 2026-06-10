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

export function getFbc(): string | undefined {
  const m = document.cookie.match(/(?:^| )_fbc=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

export function getFbp(): string | undefined {
  const m = document.cookie.match(/(?:^| )_fbp=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}
