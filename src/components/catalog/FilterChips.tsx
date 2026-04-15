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
    const gl: Record<string, string> = { masculine: "Masculino", feminine: "Femenino", unisex: "Unisex" };
    chips.push({ key: "genero", label: "Género", value: gl[params.genero] || params.genero });
  }
  if (params.precioMin != null) {
    chips.push({ key: "precioMin", label: "Mín", value: `$${Number(params.precioMin).toLocaleString("es-CO")}` });
  }
  if (params.precioMax != null) {
    chips.push({ key: "precioMax", label: "Máx", value: `$${Number(params.precioMax).toLocaleString("es-CO")}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          type="button"
          onClick={() => onRemove(chip.key, chip.key === "genero" ? undefined : chip.value)}
          className="inline-flex items-center gap-1.5 border border-[var(--gold-border)] px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-[var(--gold)] transition-colors duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5"
        >
          <span>&times;</span>
          <span>{chip.value}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-200"
      >
        Limpiar
      </button>
    </div>
  );
}
