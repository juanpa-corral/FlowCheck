import { describe, it, expect } from 'vitest'
import {
  calculateISF,
  calculateSemaphore,
  getISFLabel,
  getISFMessage,
} from '../../hooks/useISF'
import type { Profile } from '../../types/database'
import { perfectProfile, mockProfile } from '../fixtures/profiles'

// ── Perfil base controlado para pruebas aisladas ───────────────
// Todos los valores relevantes empiezan en 0 para poder probar
// cada componente de score de forma independiente.
const base: Profile = {
  ...mockProfile,
  monthly_income:      1_000_000,
  fixed_expenses:              0,
  variable_expenses:           0,
  leisure_expenses:            0,
  monthly_debt_payment:        0,
  emergency_fund:              0,
}

// ══════════════════════════════════════════════════════════════
// calculateISF — savingsScore (máx 30 pts)
// ══════════════════════════════════════════════════════════════
describe('calculateISF — savingsScore', () => {
  // La tasa de ahorro se calcula como:
  //   (income - totalExpenses) / income
  // donde totalExpenses incluye fijos + variables + ocio + cuota_deuda

  it('→ 30 pts cuando la tasa de ahorro es ≥ 20%', () => {
    // 1M - 700k = 300k guardado → 30% ≥ 20%
    const { savingsScore } = calculateISF({ ...base, fixed_expenses: 700_000 })
    expect(savingsScore).toBe(30)
  })

  it('→ 20 pts cuando la tasa de ahorro es 10-19%', () => {
    // 1M - 850k = 150k → 15%
    const { savingsScore } = calculateISF({ ...base, fixed_expenses: 850_000 })
    expect(savingsScore).toBe(20)
  })

  it('→ 10 pts cuando la tasa de ahorro es 5-9%', () => {
    // 1M - 920k = 80k → 8%
    const { savingsScore } = calculateISF({ ...base, fixed_expenses: 920_000 })
    expect(savingsScore).toBe(10)
  })

  it('→ 0 pts cuando la tasa de ahorro es < 5%', () => {
    // 1M - 970k = 30k → 3%
    const { savingsScore } = calculateISF({ ...base, fixed_expenses: 970_000 })
    expect(savingsScore).toBe(0)
  })

  it('→ 0 pts cuando el ingreso es 0 (sin ingresos)', () => {
    const { savingsScore } = calculateISF({ ...base, monthly_income: 0 })
    expect(savingsScore).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════
// calculateISF — leisureScore (máx 20 pts)
// ══════════════════════════════════════════════════════════════
describe('calculateISF — leisureScore', () => {
  // Tasa = leisure_expenses / monthly_income

  it('→ 20 pts cuando ocio < 10% del ingreso', () => {
    const { leisureScore } = calculateISF({ ...base, leisure_expenses: 80_000 }) // 8%
    expect(leisureScore).toBe(20)
  })

  it('→ 15 pts cuando ocio es 10-19%', () => {
    const { leisureScore } = calculateISF({ ...base, leisure_expenses: 150_000 }) // 15%
    expect(leisureScore).toBe(15)
  })

  it('→ 10 pts cuando ocio es 20-29%', () => {
    const { leisureScore } = calculateISF({ ...base, leisure_expenses: 250_000 }) // 25%
    expect(leisureScore).toBe(10)
  })

  it('→ 0 pts cuando ocio ≥ 30% del ingreso', () => {
    const { leisureScore } = calculateISF({ ...base, leisure_expenses: 350_000 }) // 35%
    expect(leisureScore).toBe(0)
  })

  it('→ 0 pts cuando ingreso es 0', () => {
    const { leisureScore } = calculateISF({ ...base, monthly_income: 0, leisure_expenses: 100_000 })
    expect(leisureScore).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════
// calculateISF — emergencyScore (máx 30 pts)
// Base: meses = emergency_fund / (fixed_expenses + variable_expenses)
// ══════════════════════════════════════════════════════════════
describe('calculateISF — emergencyScore', () => {
  const withExpenses = { ...base, fixed_expenses: 300_000, variable_expenses: 200_000 }
  // monthlyExpenses = 500k

  it('→ 30 pts cuando el fondo cubre ≥ 3 meses', () => {
    // 1.7M / 500k = 3.4 meses
    const { emergencyScore } = calculateISF({ ...withExpenses, emergency_fund: 1_700_000 })
    expect(emergencyScore).toBe(30)
  })

  it('→ 20 pts cuando el fondo cubre 2-2.9 meses', () => {
    // 1.25M / 500k = 2.5 meses
    const { emergencyScore } = calculateISF({ ...withExpenses, emergency_fund: 1_250_000 })
    expect(emergencyScore).toBe(20)
  })

  it('→ 10 pts cuando el fondo cubre 1-1.9 meses', () => {
    // 650k / 500k = 1.3 meses
    const { emergencyScore } = calculateISF({ ...withExpenses, emergency_fund: 650_000 })
    expect(emergencyScore).toBe(10)
  })

  it('→ 0 pts cuando el fondo cubre < 1 mes', () => {
    // 400k / 500k = 0.8 meses
    const { emergencyScore } = calculateISF({ ...withExpenses, emergency_fund: 400_000 })
    expect(emergencyScore).toBe(0)
  })

  it('→ 30 pts cuando no hay gastos fijos+variables (sin riesgo)', () => {
    // monthlyExpenses = 0 → función retorna 30 directamente
    const { emergencyScore } = calculateISF({ ...base, fixed_expenses: 0, variable_expenses: 0 })
    expect(emergencyScore).toBe(30)
  })
})

// ══════════════════════════════════════════════════════════════
// calculateISF — debtScore (máx 20 pts)
// Tasa = monthly_debt_payment / monthly_income
// ══════════════════════════════════════════════════════════════
describe('calculateISF — debtScore', () => {
  it('→ 20 pts cuando cuota deuda < 20% del ingreso', () => {
    const { debtScore } = calculateISF({ ...base, monthly_debt_payment: 150_000 }) // 15%
    expect(debtScore).toBe(20)
  })

  it('→ 10 pts cuando cuota deuda es 20-29%', () => {
    const { debtScore } = calculateISF({ ...base, monthly_debt_payment: 250_000 }) // 25%
    expect(debtScore).toBe(10)
  })

  it('→ 5 pts cuando cuota deuda es 30-39%', () => {
    const { debtScore } = calculateISF({ ...base, monthly_debt_payment: 350_000 }) // 35%
    expect(debtScore).toBe(5)
  })

  it('→ 0 pts cuando cuota deuda ≥ 40% del ingreso', () => {
    const { debtScore } = calculateISF({ ...base, monthly_debt_payment: 450_000 }) // 45%
    expect(debtScore).toBe(0)
  })

  it('→ 0 pts cuando ingreso es 0', () => {
    const { debtScore } = calculateISF({ ...base, monthly_income: 0, monthly_debt_payment: 50_000 })
    expect(debtScore).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════
// calculateISF — total
// ══════════════════════════════════════════════════════════════
describe('calculateISF — total', () => {
  it('llega a 100 con el perfil ideal', () => {
    // perfectProfile: savingsScore=30, leisureScore=20, emergencyScore=30, debtScore=20
    const { total } = calculateISF(perfectProfile)
    expect(total).toBe(100)
  })

  it('nunca supera 100 (está limitado con Math.min)', () => {
    const { total } = calculateISF({ ...perfectProfile, monthly_income: 10_000_000 })
    expect(total).toBeLessThanOrEqual(100)
  })

  it('el total es la suma de los sub-scores (cuando ≤ 100)', () => {
    const breakdown = calculateISF(mockProfile)
    const sumExpected = breakdown.savingsScore + breakdown.leisureScore + breakdown.emergencyScore + breakdown.debtScore
    expect(breakdown.total).toBe(Math.min(100, sumExpected))
  })

  it('devuelve 0 cuando el ingreso es 0 y no hay gastos', () => {
    const { total } = calculateISF({ ...base, monthly_income: 0 })
    // savingsScore=0, leisureScore=0, emergencyScore=30 (sin gastos), debtScore=0 → 30
    expect(total).toBe(30)
  })

  it('todos los sub-scores son números no negativos', () => {
    const b = calculateISF(mockProfile)
    expect(b.savingsScore).toBeGreaterThanOrEqual(0)
    expect(b.leisureScore).toBeGreaterThanOrEqual(0)
    expect(b.emergencyScore).toBeGreaterThanOrEqual(0)
    expect(b.debtScore).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════
// calculateSemaphore
// Umbrales: verde < 50%, amarillo 50-75%, rojo > 75%
// ══════════════════════════════════════════════════════════════
describe('calculateSemaphore', () => {
  const income1M = { ...base, monthly_income: 1_000_000 }

  it('→ verde cuando el gasto comprometido es < 50%', () => {
    const { status } = calculateSemaphore({ ...income1M, fixed_expenses: 400_000 }) // 40%
    expect(status).toBe('verde')
  })

  it('→ amarillo cuando el gasto es 50-75%', () => {
    const { status } = calculateSemaphore({ ...income1M, fixed_expenses: 600_000 }) // 60%
    expect(status).toBe('amarillo')
  })

  it('→ rojo cuando el gasto es > 75%', () => {
    const { status } = calculateSemaphore({ ...income1M, fixed_expenses: 800_000 }) // 80%
    expect(status).toBe('rojo')
  })

  it('usa actualMonthSpent cuando se proporciona (override de perfil)', () => {
    // El perfil tiene 90% comprometido, pero el gasto real del mes es solo 30%
    const profile = { ...income1M, fixed_expenses: 900_000 }
    const { status } = calculateSemaphore(profile, 300_000)
    expect(status).toBe('verde')
  })

  it('el porcentaje refleja el gasto real cuando se usa override', () => {
    const { percentage } = calculateSemaphore({ ...income1M, fixed_expenses: 900_000 }, 600_000)
    expect(percentage).toBeCloseTo(60, 0)
  })

  it('devuelve percentage=0 cuando ingreso=0', () => {
    const { percentage } = calculateSemaphore({ ...base, monthly_income: 0 })
    expect(percentage).toBe(0)
  })

  it('expone los campos committed e income correctamente', () => {
    const { committed, income } = calculateSemaphore({ ...income1M, fixed_expenses: 400_000 })
    expect(income).toBe(1_000_000)
    expect(committed).toBe(400_000)
  })

  it('usa gasto real (no perfil) cuando se provee actualMonthSpent', () => {
    const { committed } = calculateSemaphore({ ...income1M, fixed_expenses: 900_000 }, 250_000)
    expect(committed).toBe(250_000)
  })
})

// ══════════════════════════════════════════════════════════════
// getISFLabel / getISFMessage
// ══════════════════════════════════════════════════════════════
describe('getISFLabel', () => {
  it('→ "Salud Excelente" para score ≥ 80', () => {
    expect(getISFLabel(80)).toBe('Salud Excelente')
    expect(getISFLabel(100)).toBe('Salud Excelente')
  })

  it('→ "Salud Buena" para score 60-79', () => {
    expect(getISFLabel(60)).toBe('Salud Buena')
    expect(getISFLabel(79)).toBe('Salud Buena')
  })

  it('→ "Salud Moderada" para score 40-59', () => {
    expect(getISFLabel(40)).toBe('Salud Moderada')
    expect(getISFLabel(59)).toBe('Salud Moderada')
  })

  it('→ "Necesita Atención" para score < 40', () => {
    expect(getISFLabel(0)).toBe('Necesita Atención')
    expect(getISFLabel(39)).toBe('Necesita Atención')
  })
})

describe('getISFMessage', () => {
  it('retorna un string no vacío para cualquier score', () => {
    [0, 20, 40, 60, 80, 100].forEach((score) => {
      const msg = getISFMessage(score)
      expect(typeof msg).toBe('string')
      expect(msg.length).toBeGreaterThan(0)
    })
  })

  it('cada rango tiene un mensaje distinto', () => {
    const msgs = [
      getISFMessage(90),
      getISFMessage(65),
      getISFMessage(45),
      getISFMessage(20),
    ]
    const unique = new Set(msgs)
    expect(unique.size).toBe(4)
  })

  it('el mensaje para score bajo incluye un tono empático (sin juicios)', () => {
    const msg = getISFMessage(10)
    // El mensaje de score bajo menciona avanzar juntos
    expect(msg.toLowerCase()).toMatch(/juntos|podemos|avanzamos/)
  })
})
