"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";

export function CartContent() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-muted)] mb-6">Tu carrito está vacío.</p>
        <Link
          href="/catalogo"
          className="inline-block border border-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 py-6">
              <div className="h-24 w-20 shrink-0 bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">
                    {item.brand}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/p/${item.slug}`}
                  className="font-medium text-[var(--text)] hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-[var(--text-muted)]">{item.brand}</p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)]"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium">€{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="border border-[var(--border)] p-6 bg-[var(--bg-card)]">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Resumen
          </h2>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium mb-6">
            <span>Total</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full py-3 text-center text-sm font-medium border border-[var(--accent)] bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Proceder al pago
          </Link>
        </div>
      </div>
    </div>
  );
}
