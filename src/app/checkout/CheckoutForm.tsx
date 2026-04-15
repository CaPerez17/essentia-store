"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import Link from "next/link";
import { checkoutSchema, type CheckoutInput } from "@/lib/checkout-schema";

const CLIENT_ORDER_ID_KEY = "essentia_client_order_id";

function getOrCreateClientOrderId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CLIENT_ORDER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ORDER_ID_KEY, id);
  }
  return id;
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientOrderId, setClientOrderId] = useState<string>("");

  useEffect(() => {
    setClientOrderId(getOrCreateClientOrderId());
  }, []);

  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-muted)] mb-6">Tu carrito está vacío.</p>
        <Link
          href="/catalogo"
          className="inline-block border border-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent)]"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const raw: CheckoutInput = {
      clientOrderId: clientOrderId || undefined,
      email: (formData.get("email") as string) || "",
      phone: (formData.get("phone") as string) || undefined,
      shippingName: (formData.get("shippingName") as string) || "",
      shippingAddr: (formData.get("shippingAddr") as string) || "",
      shippingCity: (formData.get("shippingCity") as string) || "",
      shippingZip: (formData.get("shippingZip") as string) || undefined,
      shippingNotes: (formData.get("shippingNotes") as string) || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: total,
      shippingCost: 0,
      total,
    };

    const parsed = checkoutSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]?.toString();
        if (path && !fieldErrors[path]) {
          fieldErrors[path] =
            typeof issue.message === "string" ? issue.message : "Campo inválido";
        }
      }
      if (!Object.keys(fieldErrors).length && parsed.error.issues[0]) {
        setErrors({
          submit:
            typeof parsed.error.issues[0].message === "string"
              ? parsed.error.issues[0].message
              : "Revisa los datos del formulario",
        });
      } else {
        setErrors(fieldErrors);
      }
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear pedido");
      localStorage.removeItem(CLIENT_ORDER_ID_KEY);
      clearCart();
      router.push(
        `/orden/${json.code}?email=${encodeURIComponent(parsed.data.email)}`
      );
    } catch (err) {
      setErrors({
        submit: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div
          className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {errors.submit}
        </div>
      )}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClass}
          placeholder="tu@email.com"
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className={inputClass}
          placeholder="+34 600 000 000"
        />
        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
      </div>
      <div>
        <label
          htmlFor="shippingName"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Nombre completo *
        </label>
        <input
          id="shippingName"
          name="shippingName"
          type="text"
          required
          className={inputClass}
        />
        {errors.shippingName && (
          <p className={errorClass}>{errors.shippingName}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="shippingAddr"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Dirección *
        </label>
        <input
          id="shippingAddr"
          name="shippingAddr"
          type="text"
          required
          className={inputClass}
        />
        {errors.shippingAddr && (
          <p className={errorClass}>{errors.shippingAddr}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="shippingCity"
            className="block text-sm font-medium text-[var(--text)] mb-1"
          >
            Ciudad *
          </label>
          <input
            id="shippingCity"
            name="shippingCity"
            type="text"
            required
            className={inputClass}
          />
          {errors.shippingCity && (
            <p className={errorClass}>{errors.shippingCity}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="shippingZip"
            className="block text-sm font-medium text-[var(--text)] mb-1"
          >
            Código postal
          </label>
          <input id="shippingZip" name="shippingZip" type="text" className={inputClass} />
        </div>
      </div>
      <div>
        <label
          htmlFor="shippingNotes"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Notas de envío
        </label>
        <textarea
          id="shippingNotes"
          name="shippingNotes"
          rows={3}
          className={inputClass}
        />
      </div>
      <div className="border-t border-[var(--border)] pt-6">
        <div className="flex justify-between font-medium mb-6">
          <span>Total</span>
          <span>${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-medium border border-[var(--accent)] bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Confirmar pedido"}
        </button>
      </div>
    </form>
  );
}
