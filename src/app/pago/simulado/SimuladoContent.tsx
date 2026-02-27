"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SimuladoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const order = searchParams.get("order") || "";
  const intent = searchParams.get("intent") || "";
  const provider = (searchParams.get("provider") || "wompi") as "wompi" | "mercadopago";

  const [loading, setLoading] = useState<string | null>(null);

  const handleSimulate = async (status: "APPROVED" | "DECLINED") => {
    if (!order) return;
    setLoading(status);
    try {
      const res = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: order,
          provider,
          providerTxnId: intent || `txn_${Date.now()}`,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Error");
        return;
      }
      router.push(`/orden/${order}`);
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-[var(--text-muted)]">Parámetros de pago no válidos.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="border border-[var(--border)] p-6 bg-[var(--bg-card)]">
        <h1 className="text-xl font-medium text-[var(--text)] mb-2">
          Simulación de pago
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Orden: <strong>{order}</strong> · Proveedor: {provider}
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Elige el resultado a simular:
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleSimulate("APPROVED")}
            disabled={!!loading}
            className="w-full py-3 border border-green-600 text-green-700 font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {loading === "APPROVED" ? "Procesando..." : "Simular APPROVED"}
          </button>
          <button
            type="button"
            onClick={() => handleSimulate("DECLINED")}
            disabled={!!loading}
            className="w-full py-3 border border-red-600 text-red-700 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {loading === "DECLINED" ? "Procesando..." : "Simular DECLINED"}
          </button>
        </div>
      </div>
    </div>
  );
}
