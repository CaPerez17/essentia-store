"use client";

import { useState } from "react";
import type { CatalogParams } from "@/lib/catalog-params";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  params: CatalogParams;
  onApply: (params: CatalogParams) => void;
  options: {
    brands: string[];
    genders: string[];
    priceRange: { min: number; max: number };
  };
}

function ChipToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] border transition-colors duration-200 ${
        active
          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
          : "border-[var(--gold-border)] text-[var(--muted)] hover:border-[var(--gold)]/50 hover:text-[var(--cream)]"
      }`}
    >
      {label}
    </button>
  );
}

export function FilterDrawer({
  open,
  onClose,
  params,
  onApply,
  options,
}: FilterDrawerProps) {
  const [draft, setDraft] = useState<CatalogParams>({ ...params });

  // Sync draft when drawer opens
  if (open && draft !== params) {
    // Only reset on open transition
  }

  const toggleBrand = (brand: string) => {
    setDraft((d) => ({
      ...d,
      marca: d.marca.includes(brand)
        ? d.marca.filter((b) => b !== brand)
        : [...d.marca, brand],
    }));
  };

  const setGender = (g: string) => {
    setDraft((d) => ({ ...d, genero: d.genero === g ? null : g }));
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
      page: 1,
    };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  };

  // Top 10 brands by name
  const topBrands = options.brands.slice(0, 10);

  const genderLabels: Record<string, string> = {
    masculine: "Masculino",
    feminine: "Femenino",
    unisex: "Unisex",
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-[#0f0e0b] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "0.5px solid rgba(201,169,110,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "0.5px solid rgba(201,169,110,0.1)" }}>
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">
            Filtrar
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--gold)] transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Scrollable filters */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Género */}
          {options.genders.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
                Género
              </h3>
              <div className="flex flex-wrap gap-2">
                {options.genders.map((g) => (
                  <ChipToggle
                    key={g}
                    label={genderLabels[g] || g}
                    active={draft.genero === g}
                    onClick={() => setGender(g)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Marca */}
          {topBrands.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
                Marca
              </h3>
              <div className="flex flex-wrap gap-2">
                {topBrands.map((b) => (
                  <ChipToggle
                    key={b}
                    label={b}
                    active={draft.marca.includes(b)}
                    onClick={() => toggleBrand(b)}
                  />
                ))}
              </div>
              {options.brands.length > 10 && (
                <p className="mt-2 text-[9px] text-[var(--muted)]/60">
                  +{options.brands.length - 10} marcas más en el catálogo
                </p>
              )}
            </div>
          )}

          {/* Precio */}
          <div>
            <h3 className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
              Rango de precio (COP)
            </h3>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Mínimo"
                value={draft.precioMin ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    precioMin: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full bg-transparent border border-[var(--gold-border)] px-3 py-2 text-xs text-[var(--cream)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--gold)]"
              />
              <input
                type="number"
                placeholder="Máximo"
                value={draft.precioMax ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    precioMax: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full bg-transparent border border-[var(--gold-border)] px-3 py-2 text-xs text-[var(--cream)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--gold)]"
              />
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-5 space-y-3" style={{ borderTop: "0.5px solid rgba(201,169,110,0.1)" }}>
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-2.5 bg-[var(--gold)] text-[var(--dark)] text-[10px] uppercase tracking-[0.2em] font-normal transition-colors duration-300 hover:bg-[var(--accent-hover)]"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full py-2.5 border border-[var(--gold-border)] text-[var(--muted)] text-[10px] uppercase tracking-[0.2em] font-normal transition-colors duration-300 hover:text-[var(--gold)] hover:border-[var(--gold)]"
          >
            Limpiar todo
          </button>
        </div>
      </div>
    </>
  );
}
