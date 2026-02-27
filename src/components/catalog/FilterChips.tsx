"use client";

import type { CatalogParams } from "@/lib/catalog-params";

interface FilterChipsProps {
  params: CatalogParams;
  onRemove: (key: keyof CatalogParams, value?: string) => void;
  onClear: () => void;
}

export function FilterChips({ params, onRemove, onClear }: FilterChipsProps) {
  const chips: { key: keyof CatalogParams; label: string; value: string }[] = [];

  params.marca.forEach((m) => chips.push({ key: "marca", label: "Marca", value: m }));
  params.familia.forEach((f) => chips.push({ key: "familia", label: "Familia", value: f }));
  params.ocasion.forEach((o) => chips.push({ key: "ocasion", label: "Ocasión", value: o }));
  params.intensidad.forEach((i) => chips.push({ key: "intensidad", label: "Intensidad", value: i }));
  if (params.genero) {
    chips.push({ key: "genero", label: "Género", value: params.genero });
  }
  if (params.precioMin != null) {
    chips.push({ key: "precioMin", label: "Mín", value: `€${params.precioMin}` });
  }
  if (params.precioMax != null) {
    chips.push({ key: "precioMax", label: "Máx", value: `€${params.precioMax}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.value}`}
          className="inline-flex items-center gap-1.5 border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs"
        >
          <span className="text-[var(--text-muted)]">{chip.label}:</span>
          <span className="capitalize">{chip.value}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key, chip.value)}
            aria-label={`Quitar ${chip.value}`}
            className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-medium text-[var(--accent)] hover:underline"
      >
        Limpiar
      </button>
    </div>
  );
}
