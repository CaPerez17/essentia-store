"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { useEffect, useState } from "react";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { NavOverlay } from "./NavOverlay";
import { SearchBar } from "./SearchBar";

export function Header() {
  const itemCount = useCartStore((s) => s.getItemCount());
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    getOrCreateGuestId();
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-[var(--dark)]"
        style={{ borderBottom: "0.5px solid rgba(201,169,110,0.15)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label="Abrir menú"
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Menú</span>
              </button>

              <Link
                href="/"
                className="logo-essentia text-[var(--gold)] text-sm font-normal uppercase"
              >
                ESSENTIA
              </Link>
            </div>

            {/* Right: Nav */}
            <nav className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Buscar</span>
              </button>

              <Link
                href="/catalogo"
                className="nav-link hidden md:inline text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)]"
              >
                Catálogo
              </Link>
              <Link
                href="/novedades"
                className="nav-link hidden md:inline text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)]"
              >
                Novedades
              </Link>
              <Link
                href="/wishlist"
                className="nav-link hidden lg:inline text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)]"
              >
                Wishlist
              </Link>
              <Link
                href="/carrito"
                className="nav-link relative text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--gold)]"
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

      {/* Overlays */}
      <NavOverlay open={navOpen} onClose={() => setNavOpen(false)} />
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
