/**
 * Static catalog of Colombian cities we run dedicated SEO landing pages for.
 *
 * Adding a city here automatically generates:
 *   - /perfumes/{slug} static page
 *   - sitemap entry (see src/app/sitemap.ts → SEO_CITIES)
 *
 * Keep slug values in sync between this file and `SEO_CITIES` in sitemap.ts.
 */

export interface City {
  slug: string;
  name: string;
  /** Department / state — used in copy and metadata to disambiguate. */
  department: string;
  /** Estimated business-day delivery range. */
  deliveryDays: string;
}

export const CITIES: City[] = [
  { slug: "bogota", name: "Bogotá", department: "Cundinamarca", deliveryDays: "1-3" },
  { slug: "medellin", name: "Medellín", department: "Antioquia", deliveryDays: "2-4" },
  { slug: "cali", name: "Cali", department: "Valle del Cauca", deliveryDays: "2-4" },
  { slug: "barranquilla", name: "Barranquilla", department: "Atlántico", deliveryDays: "2-4" },
  { slug: "cartagena", name: "Cartagena", department: "Bolívar", deliveryDays: "2-4" },
  { slug: "bucaramanga", name: "Bucaramanga", department: "Santander", deliveryDays: "2-4" },
  { slug: "cucuta", name: "Cúcuta", department: "Norte de Santander", deliveryDays: "3-5" },
  { slug: "manizales", name: "Manizales", department: "Caldas", deliveryDays: "2-4" },
  { slug: "pereira", name: "Pereira", department: "Risaralda", deliveryDays: "2-4" },
  { slug: "santa-marta", name: "Santa Marta", department: "Magdalena", deliveryDays: "3-5" },
  { slug: "monteria", name: "Montería", department: "Córdoba", deliveryDays: "2-3" },
  { slug: "valledupar", name: "Valledupar", department: "Cesar", deliveryDays: "3-5" },
];

export function findCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
