import { createHash } from "crypto";

/**
 * Real Wompi webhook event structure.
 * @see https://docs.wompi.co/en/docs/colombia/eventos/
 */
export interface WompiEventPayload {
  event: string;
  data: {
    transaction?: {
      id: string;
      amount_in_cents: number;
      reference: string;
      status: string;
      currency?: string;
      customer_email?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  sent_at?: string;
  signature?: {
    checksum: string;
    properties: string[];
    timestamp: number;
  };
}

const WOMPI_EVENT = "transaction.updated";
const APPROVED = "APPROVED";
const DECLINED = "DECLINED";
const ERROR = "ERROR";
const VOIDED = "VOIDED";

const ESS_PREFIX = "ESS-";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

/**
 * Verifies Wompi event checksum.
 * Formula: SHA256(prop1_value + prop2_value + ... + timestamp + eventsSecret)
 */
export function verifyWompiEventSignature(
  payload: WompiEventPayload,
  eventsSecret: string
): boolean {
  const sig = payload.signature;
  if (!sig?.checksum || !Array.isArray(sig.properties) || typeof sig.timestamp !== "number") {
    return false;
  }

  const data = payload.data as Record<string, unknown>;
  let concat = "";
  for (const prop of sig.properties) {
    const val = getNestedValue(data, prop);
    concat += val != null ? String(val) : "";
  }
  concat += String(sig.timestamp);
  concat += eventsSecret;

  const computed = createHash("sha256").update(concat).digest("hex");
  return computed.toUpperCase() === sig.checksum.toUpperCase();
}

export interface ParsedWompiTransaction {
  orderCode: string;
  providerTxnId: string;
  status: "APPROVED" | "DECLINED" | "ERROR" | "VOIDED";
  amount: number;
}

/**
 * Parses real Wompi transaction.updated event.
 * Extracts orderCode from reference (ESS-XXX -> XXX).
 */
export function parseWompiTransactionEvent(
  body: unknown
): ParsedWompiTransaction | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as WompiEventPayload;

  if (payload.event !== WOMPI_EVENT || !payload.data?.transaction) {
    return null;
  }

  const txn = payload.data.transaction;
  const reference = typeof txn.reference === "string" ? txn.reference : "";
  if (!reference.startsWith(ESS_PREFIX)) {
    return null;
  }

  const orderCode = reference.slice(ESS_PREFIX.length).trim().toUpperCase();
  if (!orderCode) return null;

  const status = txn.status;
  if (![APPROVED, DECLINED, ERROR, VOIDED].includes(status)) {
    return null;
  }

  const providerTxnId = typeof txn.id === "string" ? txn.id : "";
  const amount = typeof txn.amount_in_cents === "number" ? txn.amount_in_cents : 0;

  return {
    orderCode,
    providerTxnId,
    status: status as ParsedWompiTransaction["status"],
    amount,
  };
}
