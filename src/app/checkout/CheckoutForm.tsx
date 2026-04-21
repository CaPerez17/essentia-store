"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import Link from "next/link";
import { checkoutSchema, type CheckoutInput } from "@/lib/checkout-schema";
import { COLOMBIA_DEPARTMENTS } from "@/lib/colombia-departments";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    setClientOrderId(getOrCreateClientOrderId());
  }, []);

  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-xl text-[var(--cream)] mb-2">Tu carrito está vacío</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-6">
          Agrega fragancias para continuar
        </p>
        <Link
          href="/catalogo"
          className="inline-block border border-[var(--gold-border)] px-8 py-3 text-[10px] uppercase tracking-[0.2em] text-[var(--gold)] transition-colors duration-300 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setErrors({ terms: "Debes aceptar los términos y condiciones" });
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const department = (formData.get("shippingDepartment") as string) || "";
    const city = (formData.get("shippingCity") as string) || "";

    if (!department) {
      setErrors({ shippingDepartment: "Selecciona un departamento" });
      return;
    }

    // Combine department + city for storage in shippingCity field
    const combinedCity = `${department} — ${city}`;

    const raw: CheckoutInput = {
      clientOrderId: clientOrderId || undefined,
      email: (formData.get("email") as string) || "",
      phone: (formData.get("phone") as string) || undefined,
      shippingName: (formData.get("shippingName") as string) || "",
      shippingAddr: (formData.get("shippingAddr") as string) || "",
      shippingCity: combinedCity,
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
    "w-full bg-[#0f0e0b] border border-[var(--gold-border)] px-3 py-2.5 text-sm text-[var(--cream)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--gold)] transition-colors duration-200";
  const labelClass =
    "block text-[10px] uppercase tracking-[0.2em] text-[var(--gold)] mb-2";
  const errorClass = "mt-1 text-[10px] text-red-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div
          className="border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400"
          role="alert"
        >
          {errors.submit}
        </div>
      )}

      {/* Contact */}
      <div>
        <h3 className="font-serif text-lg text-[var(--cream)] mb-4">Información de contacto</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>Email *</label>
            <input id="email" name="email" type="email" required className={inputClass} placeholder="tu@email.com" />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>Teléfono (WhatsApp)</label>
            <input id="phone" name="phone" type="tel" className={inputClass} placeholder="300 123 4567" />
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div>
        <h3 className="font-serif text-lg text-[var(--cream)] mb-4 pt-6" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
          Dirección de envío
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="shippingName" className={labelClass}>Nombre completo *</label>
            <input id="shippingName" name="shippingName" type="text" required className={inputClass} />
            {errors.shippingName && <p className={errorClass}>{errors.shippingName}</p>}
          </div>

          <div>
            <label htmlFor="shippingAddr" className={labelClass}>Dirección *</label>
            <input id="shippingAddr" name="shippingAddr" type="text" required className={inputClass} placeholder="Calle, número, apto." />
            {errors.shippingAddr && <p className={errorClass}>{errors.shippingAddr}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shippingDepartment" className={labelClass}>Departamento *</label>
              <select
                id="shippingDepartment"
                name="shippingDepartment"
                required
                defaultValue=""
                className={inputClass}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c9a96e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  appearance: "none",
                  paddingRight: "32px",
                }}
              >
                <option value="" disabled className="bg-[var(--dark)]">Selecciona...</option>
                {COLOMBIA_DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-[var(--dark)] text-[var(--cream)]">{d}</option>
                ))}
              </select>
              {errors.shippingDepartment && <p className={errorClass}>{errors.shippingDepartment}</p>}
            </div>

            <div>
              <label htmlFor="shippingCity" className={labelClass}>Ciudad *</label>
              <input id="shippingCity" name="shippingCity" type="text" required className={inputClass} />
              {errors.shippingCity && <p className={errorClass}>{errors.shippingCity}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="shippingZip" className={labelClass}>Código postal</label>
            <input id="shippingZip" name="shippingZip" type="text" className={inputClass} />
          </div>

          <div>
            <label htmlFor="shippingNotes" className={labelClass}>Notas de envío (opcional)</label>
            <textarea id="shippingNotes" name="shippingNotes" rows={3} className={inputClass} placeholder="Piso, apartamento, punto de referencia..." />
          </div>
        </div>
      </div>

      {/* T&C */}
      <div className="pt-6" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              if (e.target.checked) {
                setErrors((prev) => {
                  const { terms: _t, ...rest } = prev;
                  return rest;
                });
              }
            }}
            className="mt-0.5 w-4 h-4 bg-[#0f0e0b] border border-[var(--gold-border)] accent-[var(--gold)] cursor-pointer"
          />
          <span className="text-xs text-[var(--muted)] leading-relaxed">
            Acepto los <span className="text-[var(--gold)]">términos y condiciones</span> y la <span className="text-[var(--gold)]">política de privacidad</span> de Essentia.
          </span>
        </label>
        {errors.terms && <p className={errorClass}>{errors.terms}</p>}
      </div>

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[var(--gold)] text-[var(--dark)] text-[11px] uppercase tracking-[0.25em] font-normal transition-colors duration-300 hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            "Procesando..."
          ) : (
            <>
              Confirmar y pagar con Wompi
              <span aria-hidden>→</span>
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[10px] text-[var(--muted)]">
          Serás redirigido a Wompi para completar el pago de forma segura.
        </p>
      </div>
    </form>
  );
}
