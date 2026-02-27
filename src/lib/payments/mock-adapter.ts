import type { PaymentProvider } from "./types";

/**
 * Mock payment adapter. Returns a simulated payment URL.
 * Replace with real provider API calls (Wompi, MercadoPago) in production.
 */
export function createPaymentIntent(
  provider: PaymentProvider,
  orderCode: string
): { paymentUrl: string; providerIntentId: string } {
  const intentId = `mock_${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const paymentUrl = `${baseUrl}/pago/simulado?order=${encodeURIComponent(orderCode)}&intent=${encodeURIComponent(intentId)}&provider=${provider}`;
  return { paymentUrl, providerIntentId: intentId };
}
