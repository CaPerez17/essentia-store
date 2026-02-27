export type PaymentProvider = "wompi" | "mercadopago";

export interface PaymentIntentResult {
  paymentUrl: string;
  providerIntentId: string;
}
