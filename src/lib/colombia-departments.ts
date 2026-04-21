/**
 * Departamentos de Colombia en orden alfabético.
 */
export const COLOMBIA_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

export type ColombiaDepartment = (typeof COLOMBIA_DEPARTMENTS)[number];
