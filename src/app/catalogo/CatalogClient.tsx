"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { FilterChips } from "@/components/catalog/FilterChips";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { EmptyState } from "@/components/catalog/EmptyState";
import { OlfatoMode } from "@/components/catalog/OlfatoMode";
import {
  parseCatalogParams,
  catalogParamsToSearchParams,
  hasActiveFilters,
  DEFAULT_PARAMS,
  type CatalogParams,
} from "@/lib/catalog-params";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface BrandCount {
  brand: string;
  count: number;
}

interface CatalogClientProps {
  filterOptions: {
    brands: BrandCount[] | string[];
    families: string[];
    occasions: string[];
    intensities: string[];
    genders: string[];
    priceRange: { min: number; max: number };
  };
  totalProducts: number;
}

// Quick filters (familia olfativa + ofertas)
const QUICK_FILTERS: Array<
  | { kind: "all"; label: string }
  | { kind: "family"; key: string; label: string; icon: string }
  | { kind: "oferta"; label: string; icon: string }
> = [
  { kind: "all", label: "Todos" },
  { kind: "family", key: "oriental", label: "Oriental", icon: "🟤" },
  { kind: "family", key: "amaderado", label: "Amaderado", icon: "🪵" },
  { kind: "family", key: "floral", label: "Floral", icon: "🌸" },
  { kind: "family", key: "fresco", label: "Fresco", icon: "🍋" },
  { kind: "family", key: "gourmand", label: "Gourmand", icon: "🍫" },
  { kind: "family", key: "acuatico", label: "Acuático", icon: "💨" },
  { kind: "oferta", label: "Ofertas", icon: "🔥" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "price-asc", label: "Precio: menor" },
  { value: "price-desc", label: "Precio: mayor" },
  { value: "brand-asc", label: "Marca A-Z" },
];

export function CatalogClient({ filterOptions, totalProducts }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState<CatalogParams>(() =>
    parseCatalogParams(searchParams),
  );
  const [data, setData] = useState<{
    items: ProductWithImages[];
    total: number;
    page: number;
    pageCount: number;
  } | null>(null);
  const [accumulatedItems, setAccumulatedItems] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [olfatoMode, setOlfatoMode] = useState(false);
  const [familyCounts, setFamilyCounts] = useState<Record<string, number>>({});

  // Inline search input — local state with debounce
  const [searchInput, setSearchInput] = useState<string>(params.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync searchInput when URL q changes externally (e.g. back button)
  useEffect(() => {
    setSearchInput(params.q ?? "");
  }, [params.q]);

  const fetchProducts = useCallback(async (p: CatalogParams) => {
    setLoading(true);
    const sp = catalogParamsToSearchParams(p);
    const res = await fetch(`/api/products?${sp.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setData(null);
      if (p.page === 1) setAccumulatedItems([]);
      setLoading(false);
      return;
    }
    setData(json);
    setAccumulatedItems((prev) =>
      p.page === 1 ? json.items : [...prev, ...json.items],
    );
    setLoading(false);
  }, []);

  // Sync state with URL searchParams
  useEffect(() => {
    setParams(parseCatalogParams(searchParams));
  }, [searchParams]);

  // Fetch when params change
  useEffect(() => {
    fetchProducts(params);
  }, [params, fetchProducts]);

  const updateParams = useCallback(
    (next: CatalogParams) => {
      const qs = catalogParamsToSearchParams(next).toString();
      router.push(qs ? `/catalogo?${qs}` : "/catalogo", { scroll: false });
    },
    [router],
  );

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim();
      updateParams({ ...params, q: trimmed || null, page: 1 });
    }, 300);
  };

  const handleQuickFilter = (filter: (typeof QUICK_FILTERS)[number]) => {
    let next: CatalogParams;
    if (filter.kind === "all") {
      next = { ...params, familia: [], oferta: false, page: 1 };
    } else if (filter.kind === "oferta") {
      next = { ...params, oferta: !params.oferta, familia: [], page: 1 };
    } else {
      // family: single-select behavior for quick filters
      const isActive = params.familia.includes(filter.key);
      next = {
        ...params,
        familia: isActive ? [] : [filter.key],
        oferta: false,
        page: 1,
      };
    }
    updateParams(next);
  };

  const isQuickFilterActive = (filter: (typeof QUICK_FILTERS)[number]): boolean => {
    if (filter.kind === "all") {
      return params.familia.length === 0 && !params.oferta;
    }
    if (filter.kind === "oferta") return params.oferta;
    return params.familia.length === 1 && params.familia[0] === filter.key;
  };

  const handleRemoveChip = useCallback(
    (key: keyof CatalogParams, value?: string) => {
      const next = { ...params, page: 1 };
      if (key === "marca" && value)
        next.marca = next.marca.filter((m) => m !== value);
      else if (key === "familia" && value)
        next.familia = next.familia.filter((f) => f !== value);
      else if (key === "ocasion" && value)
        next.ocasion = next.ocasion.filter((o) => o !== value);
      else if (key === "intensidad" && value)
        next.intensidad = next.intensidad.filter((i) => i !== value);
      else if (key === "genero") next.genero = null;
      else if (key === "precioMin") next.precioMin = null;
      else if (key === "precioMax") next.precioMax = null;
      else if (key === "oferta") next.oferta = false;
      else if (key === "q") {
        next.q = null;
        setSearchInput("");
      }
      updateParams(next);
    },
    [params, updateParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    updateParams({ ...DEFAULT_PARAMS, sort: params.sort, view: params.view });
  }, [params.sort, params.view, updateParams]);

  const handleLoadMore = useCallback(() => {
    if (!data || data.page >= data.pageCount) return;
    updateParams({ ...params, page: params.page + 1 });
  }, [data, params, updateParams]);

  const handleViewToggle = (v: 3 | 4) => {
    updateParams({ ...params, view: v });
  };

  // Fetch family counts on first Olfato activation
  const enableOlfato = async () => {
    setOlfatoMode(true);
    if (Object.keys(familyCounts).length === 0) {
      try {
        const res = await fetch("/api/products/family-counts");
        const json = await res.json();
        if (json.counts) setFamilyCounts(json.counts);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOlfatoSelect = (familyKey: string) => {
    setOlfatoMode(false);
    updateParams({ ...params, familia: [familyKey], oferta: false, page: 1 });
  };

  const allItems = accumulatedItems;
  const total = data?.total ?? totalProducts;
  const hasMore = data ? data.page < data.pageCount : false;
  const filtersActive = hasActiveFilters(params);

  const countLabel = params.q
    ? `${total} resultado${total === 1 ? "" : "s"} para "${params.q}"`
    : `${total} ${total === 1 ? "fragancia" : "fragancias"}`;

  return (
    <>
      {/* ═══════════════════════ TOOLBAR ═══════════════════════ */}
      <div className="mb-6 space-y-4">
        {/* Row 1 — Quick family filters */}
        <div className="-mx-4 sm:mx-0">
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-0 py-1"
          >
            {QUICK_FILTERS.map((f) => {
              const active = isQuickFilterActive(f);
              return (
                <button
                  key={`${f.kind}-${"key" in f ? f.key : f.label}`}
                  type="button"
                  onClick={() => handleQuickFilter(f)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 text-[11px] tracking-[0.12em] transition-colors duration-200 border ${
                    active
                      ? "bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D]"
                      : "bg-white border-[#E5E5E5] text-[#6B6B6B] hover:bg-[#F5F0E8] hover:border-[#C9A96E]/40"
                  }`}
                >
                  {"icon" in f && <span aria-hidden>{f.icon}</span>}
                  <span className="uppercase">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2 — Search + sort + advanced + view toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 sm:max-w-md">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B6B6B"
              strokeWidth="1.5"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar fragancia o marca..."
              className="w-full bg-white border border-[#E5E5E5] pl-9 pr-3 py-2.5 text-sm text-[#0D0D0D] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C9A96E] transition-colors"
            />
          </div>

          {/* Sort */}
          <select
            value={params.sort}
            onChange={(e) => updateParams({ ...params, sort: e.target.value, page: 1 })}
            className="bg-white border border-[#E5E5E5] px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] text-[#0D0D0D] focus:outline-none focus:border-[#C9A96E] appearance-none cursor-pointer pr-9 transition-colors"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Advanced filters */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-[#0D0D0D] hover:border-[#C9A96E] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            <span>Más filtros</span>
            {(params.marca.length > 0 ||
              params.precioMin != null ||
              params.precioMax != null ||
              params.genero != null) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
            )}
          </button>

          {/* Olfato Mode toggle */}
          <div className="flex border border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => setOlfatoMode(false)}
              aria-label="Vista grid"
              className={`px-3 py-2.5 text-[10px] uppercase tracking-[0.15em] transition-colors ${
                !olfatoMode
                  ? "bg-[#0D0D0D] text-white"
                  : "bg-white text-[#6B6B6B] hover:text-[#0D0D0D]"
              }`}
            >
              ☰ Grid
            </button>
            <button
              type="button"
              onClick={enableOlfato}
              aria-label="Modo Olfato"
              className={`px-3 py-2.5 text-[10px] uppercase tracking-[0.15em] transition-colors ${
                olfatoMode
                  ? "bg-[#0D0D0D] text-white"
                  : "bg-white text-[#6B6B6B] hover:text-[#0D0D0D]"
              }`}
            >
              👁 Olfato
            </button>
          </div>

          {/* Grid view toggle */}
          <div className="hidden lg:flex border border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => handleViewToggle(3)}
              aria-label="Vista 3 columnas"
              className={`p-2.5 transition-colors ${
                params.view === 3
                  ? "bg-[#0D0D0D] text-white"
                  : "bg-white text-[#6B6B6B] hover:text-[#0D0D0D]"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="6" height="6" />
                <rect x="15" y="3" width="6" height="6" />
                <rect x="3" y="15" width="6" height="6" />
                <rect x="15" y="15" width="6" height="6" />
                <rect x="9" y="9" width="6" height="6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleViewToggle(4)}
              aria-label="Vista 4 columnas"
              className={`p-2.5 transition-colors ${
                params.view === 4
                  ? "bg-[#0D0D0D] text-white"
                  : "bg-white text-[#6B6B6B] hover:text-[#0D0D0D]"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="4" height="4" />
                <rect x="10" y="3" width="4" height="4" />
                <rect x="17" y="3" width="4" height="4" />
                <rect x="3" y="10" width="4" height="4" />
                <rect x="10" y="10" width="4" height="4" />
                <rect x="17" y="10" width="4" height="4" />
                <rect x="3" y="17" width="4" height="4" />
                <rect x="10" y="17" width="4" height="4" />
                <rect x="17" y="17" width="4" height="4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 3 — Active filter chips */}
        {filtersActive && (
          <div className="pt-1">
            <FilterChips
              params={params}
              onRemove={handleRemoveChip}
              onClear={handleClearFilters}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════ OLFATO MODE ═══════════════════════ */}
      {olfatoMode ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#6B6B6B] mb-6">
            Elige una familia olfativa para explorar
          </p>
          <OlfatoMode
            counts={familyCounts}
            onSelectFamily={handleOlfatoSelect}
          />
        </>
      ) : (
      <>

      {/* ═══════════════════════ RESULT COUNT ═══════════════════════ */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-6">
        {countLabel}
      </p>

      {/* ═══════════════════════ GRID ═══════════════════════ */}
      {loading && allItems.length === 0 ? (
        <CatalogSkeleton count={params.view === 4 ? 16 : 12} columns={params.view} />
      ) : allItems.length === 0 ? (
        <EmptyState query={params.q} />
      ) : (
        <>
          <div
            className={`grid grid-cols-2 gap-4 sm:gap-6 ${
              params.view === 4 ? "sm:grid-cols-3 lg:grid-cols-4" : "sm:grid-cols-3"
            }`}
          >
            {allItems.map((p) => (
              <CatalogProductCard key={p.id} product={p} />
            ))}
          </div>

          {hasMore && !loading && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="btn-primary border border-[#0D0D0D] bg-transparent text-[#0D0D0D] px-10 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#0D0D0D] hover:text-white transition-colors"
              >
                Cargar más
              </button>
            </div>
          )}

          {loading && allItems.length > 0 && (
            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
              Cargando...
            </p>
          )}
        </>
      )}
      </>
      )}

      {/* ═══════════════════════ DRAWER ═══════════════════════ */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        params={params}
        onApply={updateParams}
        resultCount={data?.total ?? null}
        options={{
          brands: filterOptions.brands,
          genders: filterOptions.genders,
          priceRange: filterOptions.priceRange,
        }}
      />
    </>
  );
}
