"use client";

import type { CatalogParams } from "@/lib/catalog-params";

interface FilterChipsProps {
  params: CatalogParams;
  onRemove: (key: keyof CatalogParams, value?: string) => void;
  onClear: () => void;
}

const FAMILY_LABELS: Record<string, string> = {
  oriental: "Oriental",
  amaderado: "Amaderado",
  woody: "Amaderado",
  floral: "Floral",
  fresco: "Fresco",
  fresh: "Fresco",
  gourmand: "Gourmand",
  dulce: "Gourmand",
  acuatico: "Acuático",
  citrico: "Cítrico",
};

const GENDER_LABELS: Record<string, string> = {
  masculine: "Hombre",
  feminine: "Mujer",
  unisex: "Unisex",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function FilterChips({ params, onRemove, onClear }: FilterChipsProps) {
  const chips: {
    key: keyof CatalogParams;
    label: string;
    value: string;
    removeValue?: string;
  }[] = [];

  params.marca.forEach((m) =>
    chips.push({ key: "marca", label: "Marca", value: m, removeValue: m }),
  );
  params.familia.forEach((f) =>
    chips.push({
      key: "familia",
      label: "Familia",
      value: FAMILY_LABELS[f] || f,
      removeValue: f,
    }),
  );
  params.ocasion.forEach((o) =>
    chips.push({ key: "ocasion", label: "Ocasión", value: o, removeValue: o }),
  );
  params.intensidad.forEach((i) =>
    chips.push({
      key: "intensidad",
      label: "Intensidad",
      value: i,
      removeValue: i,
    }),
  );
  if (params.genero) {
    chips.push({
      key: "genero",
      label: "Género",
      value: GENDER_LABELS[params.genero] || params.genero,
    });
  }
  if (params.precioMin != null) {
    chips.push({
      key: "precioMin",
      label: "Desde",
      value: fmt(params.precioMin),
    });
  }
  if (params.precioMax != null) {
    chips.push({
      key: "precioMax",
      label: "Hasta",
      value: fmt(params.precioMax),
    });
  }
  if (params.oferta) {
    chips.push({ key: "oferta", label: "", value: "En oferta" });
  }
  if (params.q) {
    chips.push({ key: "q", label: "Buscar", value: `"${params.q}"` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, idx) => (
        <button
          key={`${chip.key}-${chip.value}-${idx}`}
          type="button"
          onClick={() => onRemove(chip.key, chip.removeValue)}
          className="inline-flex items-center gap-2 bg-[#F5F0E8] border border-[#C9A96E]/40 px-3 py-1.5 text-[10px] text-[#0D0D0D] transition-colors duration-200 hover:border-[#C9A96E] hover:bg-[#C9A96E]/15 group"
        >
          {chip.label && (
            <span className="text-[#6B6B6B] uppercase tracking-[0.1em]">
              {chip.label}:
            </span>
          )}
          <span>{chip.value}</span>
          <span className="text-[#C9A96E] leading-none text-base group-hover:text-[#0D0D0D] transition-colors">
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B] hover:text-[#0D0D0D] underline underline-offset-4 decoration-[#C9A96E] transition-colors duration-200"
      >
        Limpiar todos
      </button>
    </div>
  );
}
