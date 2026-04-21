"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image-url";
import { brandSlug } from "@/lib/brands";

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
  compareAt?: number | null;
  images: { key: string }[];
}

interface BrandGroup {
  brand: string;
  count: number;
}

// Menu items — 7 now, ordered per spec
type SectionKey =
  | "default"
  | "catalogo"
  | "marcas"
  | "novedades"
  | "dupe"
  | "ofertas"
  | "quiz"
  | "wishlist";

const MENU_ITEMS: {
  key: SectionKey;
  label: string;
  href: string;
  sub: string;
}[] = [
  { key: "catalogo",  label: "Catálogo",       href: "/catalogo",                sub: "Todas las fragancias" },
  { key: "marcas",    label: "Marcas",         href: "/marcas",                  sub: "151 marcas" },
  { key: "novedades", label: "Novedades",      href: "/novedades",               sub: "Últimos lanzamientos" },
  { key: "dupe",      label: "Dupe Finder ✦",  href: "/dupe-finder",             sub: "IA · Encuentra tu alternativa" },
  { key: "ofertas",   label: "Ofertas",        href: "/catalogo?oferta=true",    sub: "Descuentos exclusivos" },
  { key: "quiz",      label: "Quiz olfativo",  href: "/quiz",                    sub: "Tu fragancia en 3 min" },
  { key: "wishlist",  label: "Wishlist",       href: "/wishlist",                sub: "Tus favoritos" },
];

const POPULAR_BRANDS = [
  "Afnan",
  "Armaf",
  "Lattafa",
  "Al-Haramain",
  "Xerjoff",
  "Creed",
  "Dior",
  "Versace",
];

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

// Cache to avoid re-fetching each time the user hovers the same section
const fetchCache: Partial<Record<SectionKey, NavProduct[]>> = {};
let brandsCache: BrandGroup[] | null = null;

export function NavOverlay({ open, onClose }: NavOverlayProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("default");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [sectionProducts, setSectionProducts] = useState<NavProduct[]>([]);
  const [sectionBrands, setSectionBrands] = useState<BrandGroup[]>([]);
  const [mounted, setMounted] = useState(false); // drives curtain animation

  // Curtain in/out
  useEffect(() => {
    if (open) {
      // Defer the "mounted" state by a frame so the clip-path transition plays
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [open]);

  // Prefetch default featured (for the initial right panel)
  useEffect(() => {
    if (!open) return;
    if (fetchCache.default) {
      setSectionProducts(fetchCache.default);
      return;
    }
    fetch("/api/products?limit=4&sort=newest")
      .then((r) => r.json())
      .then((json) => {
        const items: NavProduct[] = json.items || [];
        fetchCache.default = items;
        if (activeSection === "default") setSectionProducts(items);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fetch section data when activeSection changes
  useEffect(() => {
    if (!open) return;
    if (activeSection === "marcas") {
      if (brandsCache) {
        setSectionBrands(brandsCache);
        return;
      }
      fetch("/api/products/brands")
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          // We don't have a brands endpoint yet; fall back to using static list
          if (json?.brands) {
            brandsCache = json.brands;
            setSectionBrands(json.brands);
          }
        })
        .catch(() => {});
      return;
    }

    // Map section → query
    let endpoint: string | null = null;
    switch (activeSection) {
      case "ofertas":
        endpoint = "/api/products?limit=4&oferta=true&sort=price-asc";
        break;
      case "novedades":
        endpoint = "/api/products?limit=4&sort=newest";
        break;
      case "catalogo":
        endpoint = "/api/products?limit=4&sort=newest";
        break;
      case "dupe":
      case "quiz":
      case "wishlist":
      case "default":
        if (fetchCache.default) {
          setSectionProducts(fetchCache.default);
          return;
        }
        endpoint = "/api/products?limit=4&sort=newest";
        break;
    }

    if (!endpoint) return;

    if (fetchCache[activeSection]) {
      setSectionProducts(fetchCache[activeSection]!);
      return;
    }

    fetch(endpoint)
      .then((r) => r.json())
      .then((json) => {
        const items: NavProduct[] = json.items || [];
        fetchCache[activeSection] = items;
        setSectionProducts(items);
      })
      .catch(() => {});
  }, [activeSection, open]);

  // ESC key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Derived: right panel title
  const rightPanelTitle = (() => {
    switch (activeSection) {
      case "ofertas":   return "En oferta";
      case "novedades": return "Recién llegadas";
      case "marcas":    return "Marcas";
      case "catalogo":  return "Del catálogo";
      case "dupe":      return "Alternativas populares";
      case "quiz":      return "Perfiles olfativos";
      case "wishlist":  return "Para recordar";
      default:          return "Destacados";
    }
  })();

  return (
    <div
      className="fixed inset-0 z-[55]"
      aria-hidden={!open}
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* Curtain background — clip-path drops from top */}
      <div
        className="absolute inset-0 bg-[#0D0D0D]"
        style={{
          clipPath: mounted ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
          transition: "clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Subtle grain texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo top-left */}
        <div
          className="absolute top-6 left-6 text-[#C9A96E] text-sm uppercase tracking-[0.35em]"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.4s ease 0.4s",
          }}
        >
          ESSENTIA
        </div>

        {/* Animated X close (top-right) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="group absolute top-5 right-5 w-11 h-11 flex items-center justify-center z-20"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.4s ease 0.4s, transform 0.3s ease",
          }}
        >
          <span className="relative block w-6 h-6">
            <span
              className="absolute inset-x-0 top-1/2 h-px bg-white group-hover:bg-[#C9A96E] transition-colors"
              style={{
                transform: "translateY(-50%) rotate(45deg)",
                transition: "transform 0.3s ease, background-color 0.3s ease",
              }}
            />
            <span
              className="absolute inset-x-0 top-1/2 h-px bg-white group-hover:bg-[#C9A96E] transition-colors"
              style={{
                transform: "translateY(-50%) rotate(-45deg)",
                transition: "transform 0.3s ease, background-color 0.3s ease",
              }}
            />
            <span
              className="absolute inset-x-0 top-1/2 h-px bg-transparent scale-0 group-hover:scale-100"
              style={{
                transform: "translateY(-50%)",
                transition: "transform 0.3s ease",
              }}
            />
          </span>
        </button>

        {/* Grid content */}
        <div className="mx-auto max-w-7xl h-full px-4 sm:px-8 lg:px-12 pt-24 pb-12 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-10 lg:gap-16 min-h-[calc(100vh-10rem)]">
            {/* ═══════ LEFT: menu ═══════ */}
            <div>
              <p
                className="text-[9px] uppercase tracking-[0.3em] text-[#C9A96E] mb-10"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity 0.4s ease 0.35s, transform 0.4s ease 0.35s",
                }}
              >
                Menú principal
              </p>
              <nav>
                <ul className="space-y-3">
                  {MENU_ITEMS.map((item, i) => {
                    const isHovered = hoveredIndex === i;
                    const dimmed = hoveredIndex !== null && !isHovered;
                    return (
                      <li
                        key={item.key}
                        style={{
                          opacity: mounted ? (dimmed ? 0.2 : 1) : 0,
                          transform: mounted ? "translateY(0)" : "translateY(20px)",
                          transition: `opacity 0.4s ease ${0.4 + i * 0.08}s, transform 0.4s ease ${0.4 + i * 0.08}s`,
                        }}
                      >
                        <Link
                          href={item.href}
                          onClick={onClose}
                          onMouseEnter={() => {
                            setHoveredIndex(i);
                            setActiveSection(item.key);
                          }}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className="group relative flex items-baseline gap-6 py-2"
                        >
                          <span
                            className={`text-[10px] uppercase tracking-[0.3em] tabular-nums shrink-0 transition-colors duration-300 ${
                              isHovered ? "text-[#C9A96E]" : "text-white/30"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="relative overflow-hidden">
                            <div
                              className={`font-serif font-light leading-[1.02] transition-colors duration-300 ${
                                isHovered ? "text-white" : "text-[#2A2A2A]"
                              }`}
                              style={{ fontSize: "clamp(32px, 5vw, 52px)" }}
                            >
                              {item.label}
                            </div>
                            <p
                              className={`text-[10px] uppercase tracking-[0.25em] mt-1 transition-colors duration-300 ${
                                isHovered ? "text-[#C9A96E]/80" : "text-[#6B6B6B]"
                              }`}
                            >
                              {item.sub}
                            </p>
                            {/* Gold underline grow */}
                            <span
                              className="absolute bottom-5 left-0 right-0 h-px bg-[#C9A96E] origin-left transition-transform duration-300"
                              style={{
                                transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                              }}
                            />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* ═══════ RIGHT: dynamic panel ═══════ */}
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease 0.6s, transform 0.5s ease 0.6s",
              }}
            >
              <div className="flex items-baseline justify-between mb-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9A96E]">
                  {rightPanelTitle}
                </p>
                {activeSection === "marcas" && (
                  <Link
                    href="/marcas"
                    onClick={onClose}
                    className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] hover:text-[#C9A96E] transition-colors"
                  >
                    Ver todas →
                  </Link>
                )}
              </div>

              {/* Product grid or brand grid */}
              {activeSection === "marcas" && sectionBrands.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mb-8">
                  {sectionBrands.slice(0, 8).map((b) => (
                    <Link
                      key={b.brand}
                      href={`/marcas/${brandSlug(b.brand)}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-4 py-3 border border-[#C9A96E]/20 hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 transition-colors"
                    >
                      <span className="text-xs text-white">{b.brand}</span>
                      <span className="text-[10px] text-[#C9A96E]">
                        {b.count}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {sectionProducts.slice(0, 4).map((p) => {
                    const imgKey = p.images?.[0]?.key;
                    const imgUrl = imgKey ? resolveImageUrl(imgKey) : null;
                    const hasDiscount =
                      p.compareAt != null && p.compareAt > p.price;
                    return (
                      <Link
                        key={p.id}
                        href={`/p/${p.slug}`}
                        onClick={onClose}
                        className="group relative block aspect-[4/5] overflow-hidden bg-[#1A1A1A]"
                      >
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-widest text-[#6B6B6B]">
                            {p.brand}
                          </div>
                        )}
                        {/* Overlay gradient bottom */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(to top, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.3) 40%, transparent 70%)",
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <p className="text-[8px] uppercase tracking-[0.25em] text-[#C9A96E] mb-1 truncate">
                            {p.brand}
                          </p>
                          <p className="font-serif text-[13px] text-white leading-tight truncate">
                            {p.name}
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-[11px] text-white/80">
                              {fmt(p.price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-white/40 line-through">
                                {fmt(p.compareAt!)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {sectionProducts.length === 0 && (
                    <div className="col-span-2 py-8 text-center">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                        Cargando...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Popular brands — text list */}
              <div
                className="pt-6"
                style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}
              >
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9A96E] mb-3">
                  Marcas populares
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {POPULAR_BRANDS.map((b, i) => (
                    <Link
                      key={b}
                      href={`/marcas/${brandSlug(b)}`}
                      onClick={onClose}
                      className="text-[11px] uppercase tracking-[0.15em] text-[#6B6B6B] hover:text-[#C9A96E] transition-colors"
                    >
                      {b}
                      {i < POPULAR_BRANDS.length - 1 && (
                        <span className="text-[#C9A96E]/20 ml-4" aria-hidden>
                          ·
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
