"use client";

import { useMemo } from "react";
import type { CatalogParams } from "@/lib/catalog-params";

interface FiltersSidebarProps {
  params: CatalogParams;
  onParamsChange: (params: CatalogParams) => void;
  options: {
    brands: string[];
    families: string[];
    occasions: string[];
    intensities: string[];
    genders: string[];
    priceRange: { min: number; max: number };
  };
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {options.map((opt) => (
          <li key={opt}>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="w-4 h-4 border-[var(--border)]"
              />
              <span className="capitalize">{opt}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GenderSection({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
        Género
      </h4>
      <ul className="space-y-2">
        {options.map((opt) => (
          <li key={opt}>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="genero"
                checked={selected === opt}
                onChange={() => onSelect(selected === opt ? null : opt)}
                className="w-4 h-4 border-[var(--border)]"
              />
              <span className="capitalize">{opt}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FiltersSidebar({
  params,
  onParamsChange,
  options,
}: FiltersSidebarProps) {
  const toggleMulti = (
    key: "marca" | "familia" | "ocasion" | "intensidad",
    value: string
  ) => {
    const arr = params[key];
    const next = arr.includes(value)
      ? arr.filter((x) => x !== value)
      : [...arr, value];
    onParamsChange({ ...params, [key]: next, page: 1 });
  };

  const setGender = (value: string | null) => {
    onParamsChange({ ...params, genero: value, page: 1 });
  };

  const setPrice = (min: number | null, max: number | null) => {
    onParamsChange({ ...params, precioMin: min, precioMax: max, page: 1 });
  };

  const sortOptions = useMemo(
    () => [
      { value: "newest", label: "Más recientes" },
      { value: "price-asc", label: "Precio: menor a mayor" },
      { value: "price-desc", label: "Precio: mayor a menor" },
      { value: "name", label: "Nombre A-Z" },
    ],
    []
  );

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="sticky top-24 space-y-6">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Ordenar
          </h4>
          <select
            value={params.sort}
            onChange={(e) =>
              onParamsChange({ ...params, sort: e.target.value, page: 1 })
            }
            className="w-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {options.brands.length > 0 && (
          <FilterSection
            title="Marca"
            options={options.brands}
            selected={params.marca}
            onToggle={(v) => toggleMulti("marca", v)}
          />
        )}
        {options.families.length > 0 && (
          <FilterSection
            title="Familia olfativa"
            options={options.families}
            selected={params.familia}
            onToggle={(v) => toggleMulti("familia", v)}
          />
        )}
        {options.occasions.length > 0 && (
          <FilterSection
            title="Ocasión"
            options={options.occasions}
            selected={params.ocasion}
            onToggle={(v) => toggleMulti("ocasion", v)}
          />
        )}
        {options.intensities.length > 0 && (
          <FilterSection
            title="Intensidad"
            options={options.intensities}
            selected={params.intensidad}
            onToggle={(v) => toggleMulti("intensidad", v)}
          />
        )}
        {options.genders.length > 0 && (
          <GenderSection
            options={options.genders}
            selected={params.genero}
            onSelect={setGender}
          />
        )}

        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Precio
          </h4>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={params.precioMin ?? ""}
              onChange={(e) =>
                setPrice(
                  e.target.value ? Number(e.target.value) : null,
                  params.precioMax
                )
              }
              className="w-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <input
              type="number"
              placeholder="Max"
              value={params.precioMax ?? ""}
              onChange={(e) =>
                setPrice(
                  params.precioMin,
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
