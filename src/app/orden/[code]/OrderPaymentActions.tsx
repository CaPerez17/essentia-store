"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@prisma/client";

const TRANSFER_INSTRUCTIONS = `
Pago por transferencia bancaria:

IBAN: ES00 0000 0000 0000 0000 0000
Concepto: [CÓDIGO DE TU PEDIDO]
Importe: [TOTAL DEL PEDIDO] COP

Una vez realizada la transferencia, contacta a info@essentia.es con el justificante.
`;

export function OrderPaymentActions({ order }: { order: Order }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);

  const canPay =
    order.status === "CREATED" ||
    order.status === "PAYMENT_PENDING" ||
    order.status === "pending";

  const handlePayOnline = async (provider: "wompi" | "mercadopago") => {
    if (!canPay) return;
    setLoading(provider);
    try {
      const res = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: order.code, provider }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Error al iniciar el pago");
        return;
      }
      if (json.alreadyPaid) {
        router.refresh();
        return;
      }
      if (json.paymentUrl) {
        window.location.href = json.paymentUrl;
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  if (!canPay) return null;

  return (
    <div className="border-t border-[var(--border)] pt-6 space-y-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        Método de pago
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handlePayOnline("wompi")}
          disabled={!!loading}
          className="border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
        >
          {loading === "wompi" ? "Redirigiendo..." : "Pagar online (Wompi)"}
        </button>
        <button
          type="button"
          onClick={() => handlePayOnline("mercadopago")}
          disabled={!!loading}
          className="border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
        >
          {loading === "mercadopago" ? "Redirigiendo..." : "Pagar online (MercadoPago)"}
        </button>
        <button
          type="button"
          onClick={() => setShowTransfer(!showTransfer)}
          className="border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:border-[var(--accent)] transition-colors"
        >
          Pago por transferencia
        </button>
      </div>
      {showTransfer && (
        <div className="mt-4 p-4 border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text-muted)] whitespace-pre-wrap">
          {TRANSFER_INSTRUCTIONS.replace("[CÓDIGO DE TU PEDIDO]", order.code)
            .replace("[TOTAL DEL PEDIDO]", `$ ${order.total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`)}
        </div>
      )}
    </div>
  );
}
