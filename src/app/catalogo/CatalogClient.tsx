"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { FilterChips } from "@/components/catalog/FilterChips";
import {
  parseCatalogParams,
  catalogParamsToSearchParams,
  hasActiveFilters,
  type CatalogParams,
} from "@/lib/catalog-params";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface CatalogClientProps {
  filterOptions: {
    brands: string[];
    families: string[];
    occasions: string[];
    intensities: string[];
    genders: string[];
    priceRange: { min: number; max: number };
  };
  totalProducts: number;
}

const DEFAULT_PARAMS: CatalogParams = {
  marca: [],
  familia: [],
  ocasion: [],
  intensidad: [],
  genero: null,
  precioMin: null,
  precioMax: null,
  sort: "newest",
  page: 1,
  limit: 12,
};

export function CatalogClient({ filterOptions, totalProducts }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState<CatalogParams>(() =>
    parseCatalogParams(searchParams)
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

  const fetchProducts = useCallback(async (p: CatalogParams) => {
    setLoading(true);
    const sp = new URLSearchParams();
    p.marca.forEach((m) => sp.append("marca", m));
    p.familia.forEach((f) => sp.append("familia", f));
    p.ocasion.forEach((o) => sp.append("ocasion", o));
    p.intensidad.forEach((i) => sp.append("intensidad", i));
    if (p.genero) sp.set("genero", p.genero);
    if (p.precioMin != null) sp.set("precioMin", String(p.precioMin));
    if (p.precioMax != null) sp.set("precioMax", String(p.precioMax));
    sp.set("sort", p.sort);
    sp.set("page", String(p.page));
    sp.set("limit", String(p.limit));

    const res = await fetch(`/api/products?${sp.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setData(null);
      setAccumulatedItems([]);
      setLoading(false);
      return;
    }
    setData(json);
    setAccumulatedItems((prev) =>
      p.page === 1 ? json.items : [...prev, ...json.items]
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    setParams(parseCatalogParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    fetchProducts(params);
  }, [params, fetchProducts]);

  const updateParams = useCallback(
    (next: CatalogParams) => {
      setParams(next);
      const qs = catalogParamsToSearchParams(next).toString();
      router.push(qs ? `/catalogo?${qs}` : "/catalogo", { scroll: false });
    },
    [router]
  );

  const handleRemoveChip = useCallback(
    (key: keyof CatalogParams, value?: string) => {
      const next = { ...params, page: 1 };
      if (key === "marca" && value) next.marca = next.marca.filter((m) => m !== value);
      else if (key === "familia" && value) next.familia = next.familia.filter((f) => f !== value);
      else if (key === "ocasion" && value) next.ocasion = next.ocasion.filter((o) => o !== value);
      else if (key === "intensidad" && value) next.intensidad = next.intensidad.filter((i) => i !== value);
      else if (key === "genero") next.genero = null;
      else if (key === "precioMin") next.precioMin = null;
      else if (key === "precioMax") next.precioMax = null;
      updateParams(next);
    },
    [params, updateParams]
  );

  const handleClearFilters = useCallback(() => {
    updateParams({ ...DEFAULT_PARAMS, sort: params.sort });
  }, [params.sort, updateParams]);

  const handleLoadMore = useCallback(() => {
    if (!data || data.page >= data.pageCount) return;
    updateParams({ ...params, page: params.page + 1 });
  }, [data, params, updateParams]);

  const allItems = accumulatedItems;
  const total = data?.total ?? totalProducts;
  const hasMore = data ? data.page < data.pageCount : false;
  const filtersActive = hasActiveFilters(params);

  const sortOptions = [
    { value: "newest", label: "Más recientes" },
    { value: "price-asc", label: "Precio: menor" },
    { value: "price-desc", label: "Precio: mayor" },
    { value: "name", label: "Nombre A-Z" },
  ];

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {/* Filter button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 border border-[var(--gold-border)] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--gold)] transition-colors duration-300 hover:border-[var(--gold)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          Filtrar
          {filtersActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          )}
        </button>

        {/* Active filter chips */}
        {filtersActive && (
          <FilterChips
            params={params}
            onRemove={handleRemoveChip}
            onClear={handleClearFilters}
          />
        )}

        {/* Sort — pushed right */}
        <div className="ml-auto">
          <select
            value={params.sort}
            onChange={(e) => updateParams({ ...params, sort: e.target.value, page: 1 })}
            className="bg-transparent border border-[var(--gold-border)] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] focus:outline-none focus:border-[var(--gold)] appearance-none cursor-pointer pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a7060' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[var(--dark)] text-[var(--cream)]">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product count */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          {total} {total === 1 ? "fragancia" : "fragancias"}
        </p>
      </div>

      {/* Product grid */}
      {loading && allItems.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Cargando...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px sm:grid-cols-3 bg-[rgba(201,169,110,0.06)]">
            {allItems.map((p) => (
              <div key={p.id} className="bg-[var(--dark)]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {allItems.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-serif text-xl text-[var(--cream)] mb-2">
                Sin resultados
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Prueba con otros filtros
              </p>
            </div>
          )}

          {hasMore && !loading && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="border border-[var(--gold-border)] px-10 py-3 text-[10px] uppercase tracking-[0.2em] text-[var(--gold)] transition-colors duration-300 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5"
              >
                Cargar más
              </button>
            </div>
          )}

          {loading && allItems.length > 0 && (
            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Cargando...
            </p>
          )}
        </>
      )}

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        params={params}
        onApply={updateParams}
        options={{
          brands: filterOptions.brands,
          genders: filterOptions.genders,
          priceRange: filterOptions.priceRange,
        }}
      />
    </>
  );
}
