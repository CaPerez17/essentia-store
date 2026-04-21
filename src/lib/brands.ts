/**
 * Brand classification, slug utilities, and editorial copy for /marcas pages.
 */

export type BrandCategory = "arabe" | "nicho" | "disenador";

const ARABIC_BRANDS = new Set([
  "afnan",
  "armaf",
  "lattafa",
  "lattafa  asad",
  "latttafa asad",
  "al-haramain",
  "al haramain",
  "al haramain -l-venture",
  "al haramain amber oud",
  "al haramain amber oud -gold",
  "arabiyat",
  "rasasi",
  "rayhaan",
  "swiss arabian",
  "ahli",
  "al-jazeera",
  "al jazeera",
  "orientica",
  "orientica set",
  "khadlaj",
  "ard al zaafaran",
  "ajmal",
  "nabeel",
  "maison alhambra",
  "540 maison alhambra",
]);

const NICHO_BRANDS = new Set([
  "xerjoff",
  "creed",
  "le labo",
  "maison margiela",
  "maison francis",
  "bond 9",
  "bond no.9",
  "bond 9 the scent",
  "bond 9 fidi",
  "bond 9 new york forever",
  "bond 9 chez",
  "bond 9 new york  madison square",
  "bond 9  beekman place",
  "bond 9 wall street",
  "bond 9 new york tribeca",
  "bond 9 new york gardenia",
  "parfums de marly",
  "parfum d marly",
  "by kilian",
  "amouage",
  "initio",
  "nishane",
  "roja dove",
  "memo",
  "vilhelm",
  "louis vuitton",
  "montale",
  "matai",
  "lorenzo pazzaglia",
  "devier",
  "ilmin",
  "stallion",
  "stallion 53",
  "ahli",
  "hinode",
  "rave",
  "vulcan",
  "albane noble grand palais",
  "color albane noble grand palais",
  "dumont paris",
  "jo milano paris",
]);

export const BRAND_CATEGORY_LABELS: Record<BrandCategory, string> = {
  arabe: "Árabe",
  nicho: "Nicho",
  disenador: "Diseñador",
};

export function categorizeBrand(brand: string): BrandCategory {
  const key = brand.toLowerCase().trim();
  if (ARABIC_BRANDS.has(key)) return "arabe";
  // Check prefix matches for multi-word brands
  for (const b of Array.from(ARABIC_BRANDS)) {
    if (key.startsWith(b) || b.startsWith(key)) return "arabe";
  }
  if (NICHO_BRANDS.has(key)) return "nicho";
  for (const b of Array.from(NICHO_BRANDS)) {
    if (key.startsWith(b) || b.startsWith(key)) return "nicho";
  }
  return "disenador";
}

/** Slug-safe version of a brand name, used in /marcas/[brand] URLs. */
export function brandSlug(brand: string): string {
  return brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Editorial description generated from brand + category.
 * Custom overrides for the top brands, otherwise templated.
 */
const CUSTOM_DESCRIPTIONS: Record<string, string> = {
  afnan:
    "Casa perfumera de los Emiratos Árabes que fusiona la tradición oriental con técnicas modernas. Reconocida por su excelente relación calidad-precio.",
  armaf:
    "La casa árabe más comercial del mundo. Conocida por sus \"inspiraciones\" de fragancias icónicas a precios accesibles, sin sacrificar calidad.",
  lattafa:
    "Marca árabe con explosión mundial en redes sociales. Fragancias intensas, duraderas y con proyección envidiable.",
  xerjoff:
    "Lujo italiano extremo. Cada frasco Xerjoff es una obra de arte con ingredientes raros y composiciones únicas. Perfumería de colección.",
  creed:
    "Casa francesa con 260 años de historia. Proveedor de reyes, celebridades y aristocracia. Aventus es su ícono global.",
  "le labo":
    "Perfumería artesanal de Nueva York. Cada fragancia es mezclada a mano y etiquetada con el nombre del comprador. Minimalismo olfativo.",
  dior: "El lujo francés en su expresión más refinada. Sauvage, J'adore y Miss Dior son íconos globales.",
  chanel: "La elegancia atemporal. N°5, Bleu y Coco definen más de un siglo de perfumería de alta costura.",
};

export function brandDescription(brand: string, category: BrandCategory): string {
  const custom = CUSTOM_DESCRIPTIONS[brand.toLowerCase().trim()];
  if (custom) return custom;

  switch (category) {
    case "arabe":
      return `La perfumería árabe en su máxima expresión. ${brand} crea fragancias intensas, duraderas y con carácter propio, al alcance del mercado colombiano.`;
    case "nicho":
      return `${brand} representa la cúspide de la perfumería artesanal. Fragancias para quienes conocen la diferencia entre un perfume masivo y una obra de arte olfativa.`;
    default:
      return `La elegancia de ${brand} traducida en fragancia. Íconos del mundo de la moda y el diseño, ahora con envío directo a Colombia.`;
  }
}
