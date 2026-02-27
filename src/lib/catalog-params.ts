/**
 * URL query params for catalog filters.
 * Keys: marca, familia, ocasion, intensidad, genero, precioMin, precioMax, sort, page, limit
 */

export interface CatalogParams {
  marca: string[];
  familia: string[];
  ocasion: string[];
  intensidad: string[];
  genero: string | null;
  precioMin: number | null;
  precioMax: number | null;
  sort: string;
  page: number;
  limit: number;
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

export function parseCatalogParams(searchParams: URLSearchParams): CatalogParams {
  const getNum = (key: string): number | null => {
    const v = searchParams.get(key);
    if (!v) return null;
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  };

  return {
    marca: searchParams.getAll("marca"),
    familia: searchParams.getAll("familia"),
    ocasion: searchParams.getAll("ocasion"),
    intensidad: searchParams.getAll("intensidad"),
    genero: searchParams.get("genero"),
    precioMin: getNum("precioMin"),
    precioMax: getNum("precioMax"),
    sort: searchParams.get("sort") || DEFAULT_PARAMS.sort,
    page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
    limit: Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10))),
  };
}

export function catalogParamsToSearchParams(params: CatalogParams): URLSearchParams {
  const sp = new URLSearchParams();
  params.marca.forEach((m) => sp.append("marca", m));
  params.familia.forEach((f) => sp.append("familia", f));
  params.ocasion.forEach((o) => sp.append("ocasion", o));
  params.intensidad.forEach((i) => sp.append("intensidad", i));
  if (params.genero) sp.set("genero", params.genero);
  if (params.precioMin != null) sp.set("precioMin", String(params.precioMin));
  if (params.precioMax != null) sp.set("precioMax", String(params.precioMax));
  sp.set("sort", params.sort);
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.limit !== DEFAULT_PARAMS.limit) sp.set("limit", String(params.limit));
  return sp;
}

export function buildCatalogUrl(params: Partial<CatalogParams>, basePath = "/catalogo"): string {
  const merged = { ...DEFAULT_PARAMS, ...params };
  const qs = catalogParamsToSearchParams(merged).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function hasActiveFilters(params: CatalogParams): boolean {
  return (
    params.marca.length > 0 ||
    params.familia.length > 0 ||
    params.ocasion.length > 0 ||
    params.intensidad.length > 0 ||
    params.genero != null ||
    params.precioMin != null ||
    params.precioMax != null
  );
}
