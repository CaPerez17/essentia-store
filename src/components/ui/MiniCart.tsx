"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { useMiniCartStore } from "@/stores/mini-cart-store";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function MiniCart() {
  const { isOpen, close } = useMiniCartStore();
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const subtotal = getTotal();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[101] h-screen w-full max-w-[420px] bg-white flex flex-col transition-transform ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          borderLeft: "1px solid #E5E5E5",
          transitionDuration: "350ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Mini carrito"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #E5E5E5" }}
        >
          <div>
            <h2 className="font-serif text-xl text-[#0D0D0D] leading-none">Tu carrito</h2>
            {itemCount > 0 && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A96E] mt-1.5">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors"
          >
            <span className="text-xl leading-none">×</span>
            <span>Cerrar</span>
          </button>
        </div>

        {/* Items / empty */}
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              {/* Bag SVG */}
              <svg
                viewBox="0 0 64 64"
                width="64"
                height="64"
                fill="none"
                stroke="#C9A96E"
                strokeWidth="1.5"
                className="mx-auto mb-6 opacity-60"
                aria-hidden="true"
              >
                <path d="M14 20 L20 10 h24 l6 10 v36 a4 4 0 0 1 -4 4 h-34 a4 4 0 0 1 -4 -4 z" strokeLinejoin="round" />
                <path d="M22 26 a10 10 0 0 0 20 0" strokeLinecap="round" />
              </svg>
              <p className="font-serif text-xl text-[#0D0D0D] mb-2">
                Tu carrito está vacío
              </p>
              <p className="text-xs text-[#6B6B6B] mb-6">
                Empieza a llenar tu carrito con fragancias que te encanten.
              </p>
              <Link
                href="/catalogo"
                onClick={close}
                className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#0D0D0D] border-b border-[#C9A96E] pb-1 hover:text-[#C9A96E] transition-colors"
              >
                Descubre nuestras fragancias →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable items */}
            <ul className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5]">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 px-6 py-5">
                  {/* Image */}
                  <Link
                    href={`/p/${item.slug}`}
                    onClick={close}
                    className="shrink-0 h-20 w-16 bg-[#F5F0E8] flex items-center justify-center overflow-hidden"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[8px] uppercase tracking-widest text-[#6B6B6B] text-center">
                        {item.brand}
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-0.5 truncate">
                      {item.brand}
                    </p>
                    <Link
                      href={`/p/${item.slug}`}
                      onClick={close}
                      className="block font-serif text-sm text-[#0D0D0D] leading-tight hover:text-[#C9A96E] transition-colors mb-1.5"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-[#0D0D0D] mb-2.5">
                      {fmt(item.price)}
                    </p>

                    {/* Qty controls + remove */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-[#E5E5E5]">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          aria-label="Disminuir"
                          className="w-7 h-7 flex items-center justify-center text-[#0D0D0D] hover:bg-[#F5F0E8] transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs text-[#0D0D0D] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          aria-label="Aumentar"
                          className="w-7 h-7 flex items-center justify-center text-[#0D0D0D] hover:bg-[#F5F0E8] transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-[#0D0D0D]">
                      {fmt(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer sticky */}
            <div
              className="px-6 py-5 space-y-3 bg-white"
              style={{ borderTop: "1px solid #E5E5E5" }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                  Subtotal
                </span>
                <span className="font-serif text-xl text-[#0D0D0D]">
                  {fmt(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-[#C9A96E] text-right">
                Envío gratis a todo Colombia
              </p>

              <Link
                href="/carrito"
                onClick={close}
                className="btn-primary block text-center bg-[#0D0D0D] text-white py-3.5 text-[10px] uppercase tracking-[0.25em] hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-colors"
              >
                Ir al carrito →
              </Link>
              <button
                type="button"
                onClick={close}
                className="block w-full text-center py-2 text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors"
              >
                Seguir explorando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
