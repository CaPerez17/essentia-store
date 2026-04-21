/**
 * Default fragrance notes by family/gender when the product has none in DB.
 */

export interface ScentNotes {
  top: string[];     // Salida
  heart: string[];   // Corazón
  base: string[];    // Fondo
}

const FAMILY_NOTES: Record<string, ScentNotes> = {
  oriental: {
    top: ["Bergamota", "Naranja", "Cardamomo"],
    heart: ["Rosa", "Jazmín", "Incienso"],
    base: ["Ámbar", "Vainilla", "Sándalo"],
  },
  amaderado: {
    top: ["Limón", "Mandarina", "Pimienta rosa"],
    heart: ["Iris", "Patchouli", "Cedro"],
    base: ["Cedro", "Vetiver", "Musgo de roble"],
  },
  woody: {
    top: ["Limón", "Mandarina", "Pimienta rosa"],
    heart: ["Iris", "Patchouli", "Cedro"],
    base: ["Cedro", "Vetiver", "Musgo de roble"],
  },
  floral: {
    top: ["Bergamota", "Pera", "Litchi"],
    heart: ["Lirio", "Magnolia", "Peonia"],
    base: ["Rosa", "Jazmín", "Almizcle blanco"],
  },
  fresco: {
    top: ["Lima", "Pomelo", "Menta"],
    heart: ["Violeta", "Té verde", "Geranio"],
    base: ["Almizcle", "Cedro", "Ámbar gris"],
  },
  fresh: {
    top: ["Lima", "Pomelo", "Menta"],
    heart: ["Violeta", "Té verde", "Geranio"],
    base: ["Almizcle", "Cedro", "Ámbar gris"],
  },
  acuatico: {
    top: ["Notas marinas", "Pomelo", "Bergamota"],
    heart: ["Violeta", "Té", "Lavanda"],
    base: ["Almizcle blanco", "Cedro"],
  },
  citrico: {
    top: ["Bergamota", "Limón", "Naranja sanguina"],
    heart: ["Neroli", "Petit grain", "Romero"],
    base: ["Cedro", "Almizcle"],
  },
  dulce: {
    top: ["Caramelo", "Azafrán", "Bergamota"],
    heart: ["Vainilla", "Praliné", "Heliotropo"],
    base: ["Benjuí", "Ámbar", "Sándalo"],
  },
  frutal: {
    top: ["Pera", "Manzana", "Durazno"],
    heart: ["Rosa", "Jazmín", "Frambuesa"],
    base: ["Almizcle", "Vainilla", "Cedro"],
  },
};

const GENDER_FALLBACK: Record<string, ScentNotes> = {
  masculine: FAMILY_NOTES.oriental!,
  feminine: FAMILY_NOTES.floral!,
  unisex: FAMILY_NOTES.amaderado!,
};

const DEFAULT_NOTES: ScentNotes = FAMILY_NOTES.amaderado!;

/**
 * Resolve scent notes for a product based on family → gender → default.
 */
export function getScentNotes(
  family: string | null | undefined,
  gender: string | null | undefined,
): ScentNotes {
  if (family) {
    const normalized = family.toLowerCase().trim();
    if (FAMILY_NOTES[normalized]) return FAMILY_NOTES[normalized]!;
  }
  if (gender) {
    const normalized = gender.toLowerCase().trim();
    if (GENDER_FALLBACK[normalized]) return GENDER_FALLBACK[normalized]!;
  }
  return DEFAULT_NOTES;
}

/**
 * Generate editorial description when product has none.
 */
export function generateDescription(
  brand: string,
  name: string,
  family: string | null | undefined,
  gender: string | null | undefined,
): string {
  const familyKey = family?.toLowerCase().trim() || "";

  const familyAdjectives: Record<string, string> = {
    oriental: "explorar la sensualidad y el misterio",
    amaderado: "evocar la calidez de los bosques profundos",
    woody: "evocar la calidez de los bosques profundos",
    floral: "descubrir la feminidad etérea y el romance",
    fresco: "respirar la frescura del aire marino",
    fresh: "respirar la frescura del aire marino",
    acuatico: "sumergirse en la serenidad del océano",
    citrico: "comenzar el día con energía radiante",
    dulce: "dejarse envolver por un abrazo goloso",
    frutal: "celebrar la vitalidad de la naturaleza",
  };

  const genderMoment: Record<string, string> = {
    masculine: "el carácter y la determinación masculina",
    feminine: "la elegancia atemporal femenina",
    unisex: "la expresión personal sin fronteras",
  };

  const adjective = familyAdjectives[familyKey] || "descubrir una esencia única";
  const moment =
    genderMoment[(gender || "").toLowerCase().trim()] ||
    "un momento irrepetible";

  return `Una fragancia que invita a ${adjective}. ${brand} captura la esencia de ${moment} en cada nota de ${name}, construyendo una composición que permanece en la memoria.`;
}

/**
 * Dynamic background color per olfactive family. Used in ProductCard,
 * ProductGallery and PDP hero tint.
 */
export const familyBackgrounds: Record<string, string> = {
  oriental: "#2C1810",
  amaderado: "#1A2415",
  floral: "#2A1525",
  fresco: "#101E2A",
  citrico: "#0D1A10",
  gourmand: "#251508",
  acuatico: "#0A1520",
  default: "#111009",
};

/** Light variant (for white-card backgrounds) — very subtle tints. */
export const familyBackgroundsLight: Record<string, string> = {
  oriental: "#F5E8DC",
  amaderado: "#E8EEE0",
  floral: "#F2DFE8",
  fresco: "#DDE8F0",
  citrico: "#E8F0DE",
  gourmand: "#F0E0D0",
  acuatico: "#D8E4EE",
  default: "#F8F5EF",
};

function matchFamily(tags: string): string | null {
  const t = tags.toLowerCase();
  if (/oriental|oud|ambar|amber|incienso|incense/.test(t)) return "oriental";
  if (/amaderad|woody|wood|cedro|cedar|sandalo|sandal|vetiver|patchouli/.test(t)) return "amaderado";
  if (/floral|rosa|rose|jazmin|jasmine|peonia|lirio|magnolia/.test(t)) return "floral";
  if (/acuatico|aquatic|marino|marine|ozonico/.test(t)) return "acuatico";
  if (/fresco|fresh|aromatic/.test(t)) return "fresco";
  if (/citrico|citric|bergamota|bergamot|limon|lemon|naranja|orange|mandarina|pomelo/.test(t)) return "citrico";
  if (/gourmand|vainilla|vanilla|chocolate|caramelo|caramel|dulce|sweet/.test(t)) return "gourmand";
  return null;
}

/**
 * Returns a dark background color from the product's tags or gender.
 * Used on dark product cards, PDP gallery, etc.
 */
export function getFamilyBackground(
  tags: string | null | undefined,
  gender: string | null | undefined,
): string {
  const fam = matchFamily(tags || "");
  if (fam && familyBackgrounds[fam]) return familyBackgrounds[fam]!;
  const g = (gender || "").toLowerCase();
  if (g === "feminine" || g === "mujer") return familyBackgrounds.floral!;
  if (g === "masculine" || g === "hombre") return familyBackgrounds.oriental!;
  return familyBackgrounds.default!;
}

/** Light version for white-card contexts (catalog cards, quick view, light gallery). */
export function getFamilyBackgroundLight(
  tags: string | null | undefined,
  gender: string | null | undefined,
): string {
  const fam = matchFamily(tags || "");
  if (fam && familyBackgroundsLight[fam]) return familyBackgroundsLight[fam]!;
  const g = (gender || "").toLowerCase();
  if (g === "feminine" || g === "mujer") return familyBackgroundsLight.floral!;
  if (g === "masculine" || g === "hombre") return familyBackgroundsLight.oriental!;
  return familyBackgroundsLight.default!;
}
