"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrderDetailActions({
  orderId,
  status,
  adminKey,
  existingTracking,
}: {
  orderId: string;
  status: string;
  adminKey: string;
  existingTracking: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [tracking, setTracking] = useState(existingTracking ?? "");
  const [error, setError] = useState<string | null>(null);

  const update = async (nextStatus: string, opts: { trackingNumber?: string } = {}) => {
    setError(null);
    setLoading(nextStatus);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ status: nextStatus, trackingNumber: opts.trackingNumber }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Error al actualizar");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="bg-white border border-gray-200 rounded p-5 text-sm text-gray-600">
        Esta orden está {status.toLowerCase()}. No hay acciones disponibles.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded p-5">
      <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Acciones</h2>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="space-y-4">
        {/* Mark shipped */}
        {(status === "PAID") && (
          <div>
            <label className="text-xs text-gray-700 block mb-1.5">Número de guía</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Ej: SVR-123456"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-900"
              />
              <button
                type="button"
                onClick={() => update("SHIPPED", { trackingNumber: tracking.trim() || undefined })}
                disabled={!!loading}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {loading === "SHIPPED" ? "Guardando…" : "Marcar como enviado"}
              </button>
            </div>
          </div>
        )}

        {/* Mark delivered */}
        {status === "SHIPPED" && (
          <button
            type="button"
            onClick={() => update("DELIVERED")}
            disabled={!!loading}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading === "DELIVERED" ? "Guardando…" : "Marcar como entregado"}
          </button>
        )}

        {/* Cancel */}
        {(status === "CREATED" || status === "PAYMENT_PENDING" || status === "PAID") && (
          <button
            type="button"
            onClick={() => {
              if (confirm("¿Cancelar esta orden? Esta acción no se puede deshacer.")) {
                update("CANCELLED");
              }
            }}
            disabled={!!loading}
            className="px-4 py-2 text-sm font-medium border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
          >
            {loading === "CANCELLED" ? "Cancelando…" : "Cancelar orden"}
          </button>
        )}
      </div>
    </div>
  );
}
