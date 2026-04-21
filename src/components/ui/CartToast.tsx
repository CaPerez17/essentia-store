"use client";

import Link from "next/link";
import { useToastStore } from "@/stores/toast-store";

export function CartToast() {
  const { toast, hide } = useToastStore();

  return (
    <div
      aria-live="polite"
      className={`fixed top-20 right-6 z-[60] w-80 transition-all duration-300 ${
        toast
          ? "opacity-100 translate-x-0 pointer-events-auto"
          : "opacity-0 translate-x-8 pointer-events-none"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      {toast && (
        <div className="bg-[#0f0e0b] border border-[var(--gold-border)]" style={{ borderWidth: "0.5px", borderColor: "rgba(201,169,110,0.4)" }}>
          <div className="flex gap-3 p-4">
            <div className="h-14 w-12 shrink-0 bg-[#1a1710] overflow-hidden">
              {toast.productImage ? (
                <img src={toast.productImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[8px] uppercase tracking-widest text-[var(--muted)]">
                  {toast.productBrand}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[var(--gold)] text-sm">✓</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)]">Agregado al carrito</span>
              </div>
              <p className="font-serif text-sm text-[var(--cream)] leading-tight line-clamp-2">
                {toast.productName}
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--muted)] mt-1">
                {toast.productBrand}
              </p>
            </div>
            <button
              type="button"
              onClick={hide}
              aria-label="Cerrar"
              className="text-[var(--muted)] hover:text-[var(--gold)] text-sm leading-none self-start"
            >
              ×
            </button>
          </div>
          <Link
            href="/carrito"
            onClick={hide}
            className="block py-2.5 text-center text-[9px] uppercase tracking-[0.25em] text-[var(--dark)] bg-[var(--gold)] transition-colors duration-200 hover:bg-[var(--accent-hover)]"
          >
            Ver carrito →
          </Link>
        </div>
      )}
    </div>
  );
}
