import { createHash } from "crypto";

/**
 * Generates Wompi integrity signature for checkout.
 * Formula: SHA256(reference + amount_in_cents + currency + [expirationTime] + integritySecret)
 * Order per docs: Reference, Amount, Currency, [ExpirationDate], IntegritySecret
 * @see https://docs.wompi.co/en/docs/colombia/widget-checkout-web/
 */
export function generateWompiSignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
  expirationTime?: string
): string {
  const parts = [reference, String(amountInCents), currency];
  if (expirationTime) {
    parts.push(expirationTime);
  }
  parts.push(integritySecret);
  const concatenated = parts.join("");
  return createHash("sha256").update(concatenated).digest("hex");
}

export interface WompiCheckoutConfig {
  reference: string;
  amountInCents: number;
  currency: string;
  redirectUrl: string;
  publicKey: string;
  signature: string;
  expirationTime?: string;
}

/**
 * Builds Wompi Web Checkout URL for redirect.
 * Colombia: https://checkout.wompi.co/p/ (sandbox and production use same URL; keys differ)
 */
export function buildWompiCheckoutUrl(config: WompiCheckoutConfig): string {
  const base = "https://checkout.wompi.co/p/";
  const params = new URLSearchParams({
    "public-key": config.publicKey,
    currency: config.currency,
    "amount-in-cents": String(config.amountInCents),
    reference: config.reference,
    "signature:integrity": config.signature,
    "redirect-url": config.redirectUrl,
  });
  if (config.expirationTime) {
    params.set("expiration-time", config.expirationTime);
  }
  return `${base}?${params.toString()}`;
}
