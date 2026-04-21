"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image-url";

interface NavOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface NavProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  images: { key: string }[];
}

const MENU_ITEMS = [
  { label: "Catálogo", href: "/catalogo", sub: "Todas las fragancias" },
  { label: "Novedades", href: "/novedades", sub: "Últimos lanzamientos" },
  { label: "Wishlist", href: "/wishlist", sub: "Tus favoritos" },
  { label: "Carrito", href: "/carrito", sub: "Revisa tu selección" },
];

const POPULAR_BRANDS = [
  "Dior",
  "Creed",
  "Versace",
  "Valentino",
  "Armaf",
  "Lattafa",
  "Montale",
  "Xerjoff",
  "Tom Ford",
  "Paco Rabanne",
];

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export function NavOverlay({ open, onClose }: NavOverlayProps) {
  const [featured, setFeatured] = useState<NavProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Fetch featured products on first open
  useEffect(() => {
    if (!open || loaded) return;
    fetch("/api/products?limit=4&sort=newest")
      .then((r) => r.json())
      .then((json) => {
        setFeatured(json.items || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  // ESC key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[55] bg-[var(--dark)] transition-opacity duration-400 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ transitionDuration: "400ms" }}
      aria-hidden={!open}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className="absolute top-6 right-6 text-[var(--muted)] hover:text-[var(--gold)] transition-colors text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 z-10"
      >
        <span className="text-xl leading-none">×</span>
        Cerrar
      </button>

      {/* Logo top */}
      <div className="absolute top-6 left-6 text-[var(--gold)] text-sm uppercase tracking-[0.35em]">
        ESSENTIA
      </div>

      <div className="mx-auto max-w-7xl h-full px-4 sm:px-8 lg:px-12 pt-24 pb-12 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: menu items */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)] mb-10">
              Menú
            </p>
            <nav>
              <ul className="space-y-6">
                {MENU_ITEMS.map((item, i) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-baseline gap-6"
                    >
                      <span className="font-serif text-sm text-[var(--gold)]/30 tabular-nums group-hover:text-[var(--gold)] transition-colors duration-300">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="font-serif text-4xl sm:text-5xl font-light text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors duration-300 leading-tight">
                          {item.label}
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mt-1">
                          {item.sub}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Right: featured + brands */}
          <div>
            {/* Featured */}
            <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)] mb-6">
              Destacados
            </p>
            <div className="grid grid-cols-2 gap-3 mb-12">
              {featured.map((p) => {
                const imgKey = p.images?.[0]?.key;
                const imgUrl = imgKey ? resolveImageUrl(imgKey) : null;
                return (
                  <Link
                    key={p.id}
                    href={`/p/${p.slug}`}
                    onClick={onClose}
                    className="group bg-[#0f0e0b] border border-[var(--gold-border)]/50 hover:border-[var(--gold)] transition-colors duration-300"
                  >
                    <div className="aspect-square bg-[#1a1710] overflow-hidden">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[9px] uppercase tracking-widest text-[var(--muted)]">
                          {p.brand}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--gold)] mb-0.5 truncate">
                        {p.brand}
                      </p>
                      <p className="font-serif text-xs text-[var(--cream)] truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] mt-1">
                        {fmt(p.price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
              {!loaded && featured.length === 0 && (
                <div className="col-span-2 py-8 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Cargando...
                  </p>
                </div>
              )}
            </div>

            {/* Brands */}
            <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">
              Marcas populares
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_BRANDS.map((b) => (
                <Link
                  key={b}
                  href={`/catalogo?marca=${encodeURIComponent(b)}`}
                  onClick={onClose}
                  className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] border border-[var(--gold-border)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors duration-200"
                >
                  {b}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
