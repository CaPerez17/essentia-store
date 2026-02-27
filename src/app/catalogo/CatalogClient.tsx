"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { FiltersSidebar } from "@/components/catalog/FiltersSidebar";
import { FilterChips } from "@/components/catalog/FilterChips";
import {
  parseCatalogParams,
  catalogParamsToSearchParams,
  hasActiveFilters,
  type CatalogParams,
} from "@/lib/catalog-params";
import type { Product } from "@prisma/client";

interface CatalogClientProps {
  filterOptions: {
    brands: string[];
    families: string[];
    occasions: string[];
    intensities: string[];
    genders: string[];
    priceRange: { min: number; max: number };
  };
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

export function CatalogClient({ filterOptions }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState<CatalogParams>(() =>
    parseCatalogParams(searchParams)
  );
  const [data, setData] = useState<{
    items: Product[];
    total: number;
    page: number;
    pageCount: number;
  } | null>(null);
  const [accumulatedItems, setAccumulatedItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(
    async (p: CatalogParams) => {
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
    },
    []
  );

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
      if (key === "marca" && value) {
        next.marca = next.marca.filter((m) => m !== value);
      } else if (key === "familia" && value) {
        next.familia = next.familia.filter((f) => f !== value);
      } else if (key === "ocasion" && value) {
        next.ocasion = next.ocasion.filter((o) => o !== value);
      } else if (key === "intensidad" && value) {
        next.intensidad = next.intensidad.filter((i) => i !== value);
      } else if (key === "genero") {
        next.genero = null;
      } else if (key === "precioMin") {
        next.precioMin = null;
      } else if (key === "precioMax") {
        next.precioMax = null;
      }
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
  const total = data?.total ?? 0;
  const hasMore = data ? data.page < data.pageCount : false;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <FiltersSidebar
        params={params}
        onParamsChange={updateParams}
        options={filterOptions}
      />
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            {total} {total === 1 ? "perfume" : "perfumes"}
          </p>
          {hasActiveFilters(params) && (
            <FilterChips
              params={params}
              onRemove={handleRemoveChip}
              onClear={handleClearFilters}
            />
          )}
        </div>

        {loading && allItems.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">
            Cargando...
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {allItems.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {allItems.length === 0 && (
              <p className="py-12 text-center text-[var(--text-muted)]">
                No hay productos que coincidan con los filtros.
              </p>
            )}
            {hasMore && !loading && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="border border-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                >
                  Cargar más
                </button>
              </div>
            )}
            {loading && allItems.length > 0 && (
              <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
                Cargando...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
