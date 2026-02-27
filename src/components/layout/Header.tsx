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
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-medium tracking-tight text-[var(--text)]">
            ESSENTIA
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/catalogo"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Catálogo
            </Link>
            <Link
              href="/novedades"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Novedades
            </Link>
            <Link
              href="/wishlist"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Wishlist
            </Link>
            <Link
              href="/carrito"
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <span>Carrito</span>
              {itemCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded bg-[var(--accent)] text-white text-xs">
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
