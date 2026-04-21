"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogParams } from "@/lib/catalog-params";

interface BrandCount {
  brand: string;
  count: number;
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  params: CatalogParams;
  onApply: (params: CatalogParams) => void;
  /** Live total count for the current draft state */
  resultCount?: number | null;
  options: {
    /** Either a flat list of brand names OR a list of {brand, count}. */
    brands: string[] | BrandCount[];
    genders: string[];
    priceRange: { min: number; max: number };
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const GENDER_DATA = [
  { key: "masculine", label: "Hombre", icon: "♂" },
  { key: "feminine", label: "Mujer", icon: "♀" },
  { key: "unisex", label: "Unisex", icon: "⊕" },
];

const FAMILY_DATA = [
  { key: "oriental", label: "Oriental", color: "#8B4513" },
  { key: "amaderado", label: "Amaderado", color: "#5C3317" },
  { key: "floral", label: "Floral", color: "#E091B7" },
  { key: "fresco", label: "Fresco", color: "#7FC4B8" },
  { key: "gourmand", label: "Gourmand", color: "#A0522D" },
  { key: "acuatico", label: "Acuático", color: "#5B9BD5" },
];

const PRICE_PRESETS = [
  { label: "Hasta $200k", min: null, max: 200000 },
  { label: "$200k – $400k", min: 200000, max: 400000 },
  { label: "Más de $400k", min: 400000, max: null },
];

export function FilterDrawer({
  open,
  onClose,
  params,
  onApply,
  resultCount,
  options,
}: FilterDrawerProps) {
  const [draft, setDraft] = useState<CatalogParams>(params);
  const [brandQuery, setBrandQuery] = useState("");

  // Reset draft when opening
  useEffect(() => {
    if (open) {
      setDraft(params);
      setBrandQuery("");
    }
  }, [open, params]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Normalize brands to {brand, count}
  const brandList: BrandCount[] = useMemo(() => {
    if (options.brands.length === 0) return [];
    if (typeof options.brands[0] === "string") {
      return (options.brands as string[]).map((b) => ({ brand: b, count: 0 }));
    }
    return options.brands as BrandCount[];
  }, [options.brands]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brandList;
    return brandList.filter((b) => b.brand.toLowerCase().includes(q));
  }, [brandList, brandQuery]);

  const toggleBrand = (brand: string) => {
    setDraft((d) => ({
      ...d,
      marca: d.marca.includes(brand) ? d.marca.filter((b) => b !== brand) : [...d.marca, brand],
    }));
  };

  const toggleFamily = (fam: string) => {
    setDraft((d) => ({
      ...d,
      familia: d.familia.includes(fam) ? d.familia.filter((f) => f !== fam) : [...d.familia, fam],
    }));
  };

  const setGender = (g: string) => {
    setDraft((d) => ({ ...d, genero: d.genero === g ? null : g }));
  };

  const applyPricePreset = (min: number | null, max: number | null) => {
    setDraft((d) => ({ ...d, precioMin: min, precioMax: max }));
  };

  const handleApply = () => {
    onApply({ ...draft, page: 1 });
    onClose();
  };

  const handleClear = () => {
    const cleared: CatalogParams = {
      ...draft,
      marca: [],
      familia: [],
      ocasion: [],
      intensidad: [],
      genero: null,
      precioMin: null,
      precioMax: null,
      oferta: false,
      page: 1,
    };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  };

  const totalBrandsFound = brandList.length;
  const showingCount = filteredBrands.length;

  return (
    <>
      {/* Overlay (semi-transparent so user still sees grid behind) */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — slides from RIGHT, WHITE bg */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[380px] bg-white flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ borderLeft: "1px solid #E5E5E5" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #E5E5E5" }}
        >
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#0D0D0D]">
            Más filtros
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* A — Género */}
          <div>
            <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-3">
              Género
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_DATA.map((g) => {
                const active = draft.genero === g.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGender(g.key)}
                    className={`flex flex-col items-center py-3 border transition-colors duration-200 ${
                      active
                        ? "bg-[#F5F0E8] border-[#C9A96E] text-[#0D0D0D]"
                        : "bg-white border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A96E]/50"
                    }`}
                  >
                    <span className={`text-lg mb-1 ${active ? "text-[#C9A96E]" : ""}`}>
                      {g.icon}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em]">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B — Familia olfativa */}
          <div>
            <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-3">
              Familia olfativa
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {FAMILY_DATA.map((f) => {
                const active = draft.familia.includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFamily(f.key)}
                    className={`flex items-center gap-2 px-3 py-2 border transition-colors duration-200 ${
                      active
                        ? "bg-[#F5F0E8] border-[#C9A96E] text-[#0D0D0D]"
                        : "bg-white border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A96E]/50"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: f.color }}
                    />
                    <span className="text-[11px]">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C — Marca (with inline search) */}
          {brandList.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                  Marca
                </h3>
                <span className="text-[9px] text-[#6B6B6B]/60">
                  {showingCount === totalBrandsFound
                    ? `${totalBrandsFound} disponibles`
                    : `${showingCount} de ${totalBrandsFound}`}
                </span>
              </div>

              {/* Brand search input */}
              <div className="relative mb-3">
                <input
                  type="search"
                  value={brandQuery}
                  onChange={(e) => setBrandQuery(e.target.value)}
                  placeholder="Buscar marca..."
                  className="w-full bg-white border border-[#E5E5E5] pl-9 pr-3 py-2 text-xs text-[#0D0D0D] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C9A96E] transition-colors"
                />
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
              </div>

              {/* Brand list */}
              <ul className="max-h-[200px] overflow-y-auto pr-1 -mr-1 space-y-1">
                {filteredBrands.slice(0, brandQuery ? 50 : 8).map((b) => {
                  const active = draft.marca.includes(b.brand);
                  return (
                    <li key={b.brand}>
                      <label className="flex items-center justify-between gap-2 px-2 py-1.5 cursor-pointer hover:bg-[#F5F0E8] transition-colors rounded-sm">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleBrand(b.brand)}
                            className="w-4 h-4 accent-[#C9A96E] cursor-pointer"
                          />
                          <span className="text-xs text-[#0D0D0D]">{b.brand}</span>
                        </div>
                        {b.count > 0 && (
                          <span className="text-[10px] text-[#6B6B6B]">({b.count})</span>
                        )}
                      </label>
                    </li>
                  );
                })}
                {filteredBrands.length === 0 && (
                  <li className="text-center py-6 text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                    Sin resultados
                  </li>
                )}
              </ul>
              {!brandQuery && brandList.length > 8 && (
                <p className="mt-2 text-[9px] text-[#6B6B6B]">
                  Escribe arriba para buscar entre todas las marcas
                </p>
              )}
            </div>
          )}

          {/* D — Rango de precio */}
          <div>
            <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-3">
              Rango de precio (COP)
            </h3>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PRICE_PRESETS.map((p) => {
                const active =
                  draft.precioMin === p.min && draft.precioMax === p.max;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPricePreset(p.min, p.max)}
                    className={`px-2 py-2 text-[10px] uppercase tracking-[0.1em] border transition-colors duration-200 ${
                      active
                        ? "border-[#C9A96E] bg-[#F5F0E8] text-[#0D0D0D]"
                        : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A96E]/50"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Numeric inputs */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={`Mín (${fmt(options.priceRange.min)})`}
                value={draft.precioMin ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    precioMin: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full bg-white border border-[#E5E5E5] px-3 py-2 text-xs text-[#0D0D0D] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C9A96E] transition-colors"
              />
              <span className="text-[#6B6B6B] text-xs">—</span>
              <input
                type="number"
                placeholder={`Máx (${fmt(options.priceRange.max)})`}
                value={draft.precioMax ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    precioMax: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full bg-white border border-[#E5E5E5] px-3 py-2 text-xs text-[#0D0D0D] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C9A96E] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-5 space-y-3"
          style={{ borderTop: "1px solid #E5E5E5" }}
        >
          <button
            type="button"
            onClick={handleApply}
            className="btn-primary w-full py-3 bg-[#0D0D0D] text-white text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-colors"
          >
            {resultCount != null
              ? `Ver ${resultCount} ${resultCount === 1 ? "fragancia" : "fragancias"}`
              : "Aplicar filtros"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full py-2 text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors"
          >
            Limpiar todos los filtros
          </button>
        </div>
      </div>
    </>
  );
}
