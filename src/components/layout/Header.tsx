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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    getOrCreateGuestId();
  }, []);

  // Scroll listener — flips header style after 80px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bgClass = scrolled ? "bg-[#0D0D0D]" : "bg-white";
  const borderStyle = scrolled
    ? "0.5px solid rgba(201,169,110,0.15)"
    : "1px solid #F0F0F0";
  const logoColor = scrolled ? "text-[#C9A96E]" : "text-[#0D0D0D]";
  const linkColor = scrolled
    ? "text-[#6B6B6B] hover:text-[#C9A96E]"
    : "text-[#6B6B6B] hover:text-[#0D0D0D]";
  const iconStroke = scrolled ? "#C9A96E" : "#0D0D0D";

  return (
    <>
      <header
        className={`sticky top-0 z-30 ${bgClass} transition-colors duration-300`}
        style={{ borderBottom: borderStyle }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label="Abrir menú"
                className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] ${linkColor} transition-colors duration-300`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Menú</span>
              </button>

              <Link
                href="/"
                className={`logo-essentia text-sm font-normal uppercase ${logoColor}`}
              >
                ESSENTIA
              </Link>
            </div>

            {/* Right: Nav */}
            <nav className="flex items-center gap-6">
              <Link
                href="/catalogo"
                className={`nav-link hidden md:inline text-[11px] uppercase tracking-[0.18em] ${linkColor}`}
              >
                Catálogo
              </Link>
              <Link
                href="/catalogo?ordenar=marca"
                className={`nav-link hidden md:inline text-[11px] uppercase tracking-[0.18em] ${linkColor}`}
              >
                Marcas
              </Link>
              <Link
                href="/novedades"
                className={`nav-link hidden md:inline text-[11px] uppercase tracking-[0.18em] ${linkColor}`}
              >
                Novedades
              </Link>
              <Link
                href="/catalogo?oferta=true"
                className={`nav-link hidden md:inline text-[11px] uppercase tracking-[0.18em] ${linkColor}`}
              >
                Ofertas
              </Link>

              {/* Search icon */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
                className={`${linkColor} transition-colors duration-300`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.3">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>

              {/* Wishlist icon */}
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className={`${linkColor} transition-colors duration-300`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.3">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* Cart icon + badge */}
              <Link
                href="/carrito"
                aria-label="Carrito"
                className={`relative ${linkColor} transition-colors duration-300`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.3">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 6h18" strokeLinecap="round" />
                  <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
                </svg>
                {itemCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C9A96E] text-[#0D0D0D] text-[9px] flex items-center justify-center font-medium"
                  >
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
