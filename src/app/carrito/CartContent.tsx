"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export function CartContent() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-2xl text-[var(--cream)] mb-2">Tu carrito está vacío</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-8">
          Explora nuestro catálogo de fragancias
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

  const total = getTotal();

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
      {/* Items */}
      <div>
        <ul className="divide-y divide-[var(--gold-border)]">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 py-6">
              <Link
                href={`/p/${item.slug}`}
                className="h-28 w-24 shrink-0 bg-[#0f0e0b] border border-[var(--gold-border)] overflow-hidden"
              >
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[9px] uppercase tracking-widest text-[var(--muted)]">
                    {item.brand}
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)] mb-1">
                  {item.brand}
                </p>
                <Link
                  href={`/p/${item.slug}`}
                  className="block font-serif text-lg text-[var(--cream)] hover:text-[var(--gold)] transition-colors leading-tight"
                >
                  {item.name}
                </Link>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center border border-[var(--gold-border)]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-xs text-[var(--cream)]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-[9px] uppercase tracking-[0.15em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm text-[var(--cream)]">
                  {fmt(item.price * item.quantity)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-[10px] text-[var(--muted)] mt-1">
                    {fmt(item.price)} c/u
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 self-start">
        <div className="border border-[var(--gold-border)] bg-[#0f0e0b]">
          <div className="px-6 py-5" style={{ borderBottom: "0.5px solid rgba(201,169,110,0.15)" }}>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">
              Resumen
            </h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex justify-between text-xs text-[var(--muted)] mb-2">
              <span>Subtotal</span>
              <span>{fmt(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--muted)] mb-4">
              <span>Envío</span>
              <span className="text-[var(--gold)]">Gratis</span>
            </div>
            <div
              className="flex justify-between items-baseline pt-4"
              style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)]">
                Total
              </span>
              <span className="font-serif text-2xl text-[var(--cream)]">
                {fmt(total)}
              </span>
            </div>
            <p className="mt-3 text-center text-[10px] text-[var(--gold)]/70 tracking-wide">
              Envío gratis en todos los pedidos a Colombia
            </p>
          </div>

          <div className="px-6 pb-6">
            <Link
              href="/checkout"
              className="block w-full py-3 text-center text-[10px] uppercase tracking-[0.25em] text-[var(--dark)] bg-[var(--gold)] transition-colors duration-300 hover:bg-[var(--accent-hover)]"
            >
              Proceder al pago
            </Link>
          </div>

          {/* Trust badges */}
          <div
            className="grid grid-cols-4 gap-1 px-3 py-4"
            style={{ borderTop: "0.5px solid rgba(201,169,110,0.1)" }}
          >
            {[
              { icon: "🔒", label: "Pago\nseguro" },
              { icon: "✓", label: "Origi-\nnales" },
              { icon: "📦", label: "Envío\nColombia" },
              { icon: "↩", label: "Garantía\nsatisfacción" },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <div className="text-[var(--gold)] text-xs mb-1">{b.icon}</div>
                <p className="text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] leading-tight whitespace-pre-line">
                  {b.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
