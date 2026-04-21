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
