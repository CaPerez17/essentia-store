"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { useEffect } from "react";
import { getOrCreateGuestId } from "@/lib/guest-id";

export function Header() {
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    getOrCreateGuestId();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[var(--dark)]" style={{ borderBottom: "0.5px solid rgba(201,169,110,0.15)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-[var(--gold)] text-sm font-normal uppercase tracking-[0.35em]"
          >
            ESSENTIA
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/catalogo"
              className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300"
            >
              Catálogo
            </Link>
            <Link
              href="/novedades"
              className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300"
            >
              Novedades
            </Link>
            <Link
              href="/wishlist"
              className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300"
            >
              Wishlist
            </Link>
            <Link
              href="/carrito"
              className="relative text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300"
            >
              Carrito
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-3 w-4 h-4 rounded-full bg-[var(--gold)] text-[var(--dark)] text-[9px] flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
