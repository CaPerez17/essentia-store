"use client";

import { useCartStore } from "@/stores/cart-store";

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export function CheckoutSummary() {
  const { items, getTotal } = useCartStore();
  const subtotal = getTotal();
  const shippingCost = 0; // Free shipping
  const total = subtotal + shippingCost;

  return (
    <aside className="lg:sticky lg:top-24 self-start">
      <div className="border border-[var(--gold-border)] bg-[#0f0e0b]">
        <div className="px-6 py-5" style={{ borderBottom: "0.5px solid rgba(201,169,110,0.15)" }}>
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">
            Resumen del pedido
          </h2>
        </div>

        {/* Items */}
        <ul className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-3">
              <div className="h-16 w-14 shrink-0 bg-[#1a1710] border border-[var(--gold-border)] overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[8px] uppercase tracking-widest text-[var(--muted)]">
                    {item.brand}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--gold)] mb-0.5 truncate">
                  {item.brand}
                </p>
                <p className="font-serif text-sm text-[var(--cream)] leading-tight mb-1 line-clamp-2">
                  {item.name}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  {item.quantity} × {fmt(item.price)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-[var(--cream)]">
                  {fmt(item.price * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="px-6 py-4" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
          <div className="flex justify-between text-xs text-[var(--muted)] mb-2">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--muted)] mb-4">
            <span>Envío</span>
            <span className="text-[var(--gold)]">Gratis</span>
          </div>
          <div className="flex justify-between items-baseline pt-3" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)]">Total</span>
            <span className="font-serif text-xl text-[var(--cream)]">{fmt(total)}</span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="px-6 py-4 grid grid-cols-3 gap-2" style={{ borderTop: "0.5px solid rgba(201,169,110,0.1)" }}>
          <div className="text-center">
            <div className="text-[var(--gold)] text-sm mb-1">🔒</div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-[var(--muted)]">Pago seguro</p>
          </div>
          <div className="text-center">
            <div className="text-[var(--gold)] text-sm mb-1">✓</div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-[var(--muted)]">Originales</p>
          </div>
          <div className="text-center">
            <div className="text-[var(--gold)] text-sm mb-1">📦</div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-[var(--muted)]">Envío Colombia</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
