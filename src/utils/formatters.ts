// Formatea número como pesos colombianos: $1.200.000
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Convierte string de input a número seguro
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Formatea porcentaje con un decimal
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const INCOME_SOURCE_LABELS: Record<string, string> = {
  beca: 'Beca',
  trabajo_parcial: 'Trabajo parcial',
  apoyo_familiar: 'Apoyo familiar',
  freelance: 'Freelance',
  otro: 'Otro',
};

export const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  alimentacion: 'Alimentación',
  transporte: 'Transporte',
  ocio: 'Ocio',
  educacion: 'Educación',
  salud: 'Salud',
  servicios: 'Servicios',
  otros: 'Otros',
};
