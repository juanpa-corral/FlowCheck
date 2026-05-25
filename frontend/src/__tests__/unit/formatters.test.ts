import { describe, it, expect } from 'vitest'
import {
  parseAmount,
  formatPercent,
  formatCOP,
  INCOME_SOURCE_LABELS,
  BUDGET_CATEGORY_LABELS,
} from '../../utils/formatters'

// ── parseAmount ────────────────────────────────────────────────

describe('parseAmount', () => {
  it('devuelve 0 para string vacío', () => {
    expect(parseAmount('')).toBe(0)
  })

  it('devuelve 0 para string de solo espacios', () => {
    expect(parseAmount('   ')).toBe(0)
  })

  it('devuelve 0 para texto no numérico', () => {
    expect(parseAmount('abc')).toBe(0)
  })

  it('parsea un entero limpio', () => {
    expect(parseAmount('1200000')).toBe(1_200_000)
  })

  it('parsea un decimal con punto', () => {
    expect(parseAmount('1.5')).toBe(1.5)
  })

  it('elimina el símbolo $ antes de parsear', () => {
    expect(parseAmount('$50000')).toBe(50_000)
  })

  it('elimina comas de los miles antes de parsear', () => {
    // '1,200' → '1200' → 1200
    expect(parseAmount('1,200')).toBe(1200)
  })

  it('parsea cero correctamente', () => {
    expect(parseAmount('0')).toBe(0)
  })

  it('devuelve solo la parte antes del segundo punto', () => {
    // parseFloat('1.5.2') === 1.5  (JS se detiene en el segundo punto)
    expect(parseAmount('1.5.2')).toBe(1.5)
  })

  it('ignora caracteres especiales mixtos', () => {
    expect(parseAmount('$1.500.000')).toBe(1.5) // puntos = separadores → '1.500.000' → parseFloat → 1.5 (primer punto)
  })
})

// ── formatPercent ──────────────────────────────────────────────

describe('formatPercent', () => {
  it('formatea con un decimal', () => {
    expect(formatPercent(12.567)).toBe('12.6%')
  })

  it('formatea cero', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('formatea 100', () => {
    expect(formatPercent(100)).toBe('100.0%')
  })

  it('redondea correctamente hacia abajo', () => {
    expect(formatPercent(33.333)).toBe('33.3%')
  })

  it('redondea correctamente hacia arriba', () => {
    expect(formatPercent(33.666)).toBe('33.7%')
  })

  it('incluye el símbolo %', () => {
    expect(formatPercent(50)).toContain('%')
  })
})

// ── formatCOP ──────────────────────────────────────────────────

describe('formatCOP', () => {
  it('incluye la cifra en la salida', () => {
    const result = formatCOP(1_200_000)
    // Eliminar no-dígitos y verificar la cifra completa
    expect(result.replace(/\D/g, '')).toContain('1200000')
  })

  it('incluye símbolo de moneda', () => {
    const result = formatCOP(50_000)
    expect(result).toMatch(/\$|COP/)
  })

  it('formatea cero sin decimales', () => {
    const result = formatCOP(0)
    expect(result).toContain('0')
    expect(result.replace(/\D/g, '')).toBe('0')
  })

  it('no incluye decimales (maximumFractionDigits=0)', () => {
    // Con fracciones → debe redondear, no mostrar decimales
    const result = formatCOP(1500.75)
    const digits  = result.replace(/\D/g, '')
    // El resultado debe ser 1501 (redondeado), no 1500 + fracción
    expect(digits.length).toBeGreaterThanOrEqual(4)
    // No debe contener ',75' ni '.75' al final
    expect(result).not.toMatch(/[,.]75/)
  })

  it('maneja números grandes', () => {
    const result = formatCOP(10_000_000)
    expect(result.replace(/\D/g, '')).toContain('10000000')
  })
})

// ── Labels ─────────────────────────────────────────────────────

describe('INCOME_SOURCE_LABELS', () => {
  it('contiene todas las fuentes de ingreso esperadas', () => {
    expect(INCOME_SOURCE_LABELS.beca).toBe('Beca')
    expect(INCOME_SOURCE_LABELS.trabajo_parcial).toBe('Trabajo parcial')
    expect(INCOME_SOURCE_LABELS.apoyo_familiar).toBe('Apoyo familiar')
    expect(INCOME_SOURCE_LABELS.freelance).toBe('Freelance')
    expect(INCOME_SOURCE_LABELS.otro).toBe('Otro')
  })
})

describe('BUDGET_CATEGORY_LABELS', () => {
  it('contiene las categorías de presupuesto esperadas', () => {
    expect(BUDGET_CATEGORY_LABELS.alimentacion).toBe('Alimentación')
    expect(BUDGET_CATEGORY_LABELS.transporte).toBe('Transporte')
    expect(BUDGET_CATEGORY_LABELS.ocio).toBe('Ocio')
    expect(BUDGET_CATEGORY_LABELS.educacion).toBe('Educación')
    expect(BUDGET_CATEGORY_LABELS.salud).toBe('Salud')
    expect(BUDGET_CATEGORY_LABELS.servicios).toBe('Servicios')
    expect(BUDGET_CATEGORY_LABELS.otros).toBe('Otros')
  })
})
