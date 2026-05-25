// ============================================================
// FlowCheck 2.0 — Simulador de Score Crediticio
// Módulo 7: Salud Crediticia
//
// El score se calcula en el rango 150-950 (igual que DataCrédito)
// a partir de los 4 pilares del perfil financiero.
// Es una estimación EDUCATIVA, no un reporte real.
// ============================================================

import { useMemo } from 'react'
import type { Profile } from '../types/database'

// ── Tipos ─────────────────────────────────────────────────────

export type FactorImpact = 'excelente' | 'bueno' | 'regular' | 'bajo'

export interface ScoreFactor {
  id: string
  label: string
  emoji: string
  factorScore: number           // 150-950 para ese pilar
  impact: FactorImpact
  weight: number                // 0-1, peso en el score total
  currentValue: string          // descripción legible del valor actual
  interpretation: string        // qué significa
}

export interface CreditScoreResult {
  score: number                 // 150-950
  label: string                 // "Excelente" | "Muy bueno" | ...
  sublabel: string              // texto motivador sin juicio
  color: string
  emoji: string
  factors: ScoreFactor[]
  goodHabits: string[]          // checkmarks verdes
  improvements: { text: string; impact: string }[]  // tips con impacto estimado
}

// ── Pesos de cada factor ──────────────────────────────────────

const W = { debt: 0.35, emergency: 0.25, savings: 0.25, leisure: 0.15 } as const

// ── Funciones de puntuación por pilar ────────────────────────

function debtPillar(income: number, monthlyDebt: number): { score: number; value: string; interpretation: string } {
  if (income <= 0) return { score: 600, value: 'Sin datos', interpretation: 'Completa tu perfil de ingresos' }

  const ratio = monthlyDebt / income
  const pct   = (ratio * 100).toFixed(0)

  if (monthlyDebt === 0) return {
    score: 920, value: 'Sin deudas',
    interpretation: 'Excelente — no tienes compromisos de deuda',
  }
  if (ratio < 0.10) return {
    score: 855, value: `${pct}% del ingreso`,
    interpretation: 'Muy baja carga — amplio margen disponible',
  }
  if (ratio < 0.20) return {
    score: 730, value: `${pct}% del ingreso`,
    interpretation: 'Carga manejable, dentro del rango saludable',
  }
  if (ratio < 0.30) return {
    score: 600, value: `${pct}% del ingreso`,
    interpretation: 'En el límite — merece atención',
  }
  if (ratio < 0.40) return {
    score: 450, value: `${pct}% del ingreso`,
    interpretation: 'Por encima del 30% — zona de estrés financiero',
  }
  return {
    score: 280, value: `${pct}% del ingreso`,
    interpretation: 'Alta carga — priorizar liquidar deudas de alto costo',
  }
}

function emergencyPillar(monthlyExp: number, fund: number): { score: number; value: string; interpretation: string } {
  if (monthlyExp <= 0) return { score: 750, value: 'Sin datos', interpretation: 'Completa tus gastos fijos para calcular' }

  const months = fund / monthlyExp

  if (months >= 6) return {
    score: 950, value: `${months.toFixed(1)} meses`,
    interpretation: 'Cobertura excelente — protección sólida ante imprevistos',
  }
  if (months >= 3) return {
    score: 820, value: `${months.toFixed(1)} meses`,
    interpretation: 'Buena cobertura — cumple el estándar recomendado',
  }
  if (months >= 1.5) return {
    score: 680, value: `${months.toFixed(1)} meses`,
    interpretation: 'Cobertura parcial — en construcción',
  }
  if (months > 0) return {
    score: 520, value: `${months.toFixed(1)} meses`,
    interpretation: 'Fondo mínimo — vulnerable a imprevistos pequeños',
  }
  return {
    score: 320, value: '$0 de fondo',
    interpretation: 'Sin colchón — cualquier imprevisto puede generar deuda',
  }
}

function savingsPillar(income: number, allExpenses: number): { score: number; value: string; interpretation: string } {
  if (income <= 0) return { score: 500, value: 'Sin datos', interpretation: 'Completa tu ingreso mensual' }

  const rate    = (income - allExpenses) / income
  const ratePct = (rate * 100).toFixed(0)

  if (rate >= 0.25) return {
    score: 920, value: `${ratePct}% de ahorro`,
    interpretation: 'Tasa de ahorro excelente — bien encima del 20% recomendado',
  }
  if (rate >= 0.15) return {
    score: 800, value: `${ratePct}% de ahorro`,
    interpretation: 'Tasa saludable — en el rango óptimo',
  }
  if (rate >= 0.08) return {
    score: 660, value: `${ratePct}% de ahorro`,
    interpretation: 'Ahorro moderado — hay margen para mejorar',
  }
  if (rate >= 0) return {
    score: 510, value: `${ratePct}% de ahorro`,
    interpretation: 'Ahorro muy bajo — los gastos consumen casi todo',
  }
  return {
    score: 320, value: 'Gastos > Ingresos',
    interpretation: 'Déficit mensual — situación que requiere ajuste urgente',
  }
}

function leisurePillar(income: number, leisure: number): { score: number; value: string; interpretation: string } {
  if (income <= 0) return { score: 650, value: 'Sin datos', interpretation: 'Completa tu ingreso mensual' }

  const ratio = leisure / income
  const pct   = (ratio * 100).toFixed(0)

  if (ratio < 0.10) return {
    score: 900, value: `${pct}% del ingreso`,
    interpretation: 'Control excelente del gasto en ocio',
  }
  if (ratio < 0.20) return {
    score: 760, value: `${pct}% del ingreso`,
    interpretation: 'Gasto en ocio equilibrado y planificado',
  }
  if (ratio < 0.30) return {
    score: 620, value: `${pct}% del ingreso`,
    interpretation: 'En el límite — ojo con el ocio no planificado',
  }
  return {
    score: 460, value: `${pct}% del ingreso`,
    interpretation: 'Ocio por encima del 30% — impacto en ahorro y deuda',
  }
}

// ── Score label y color ───────────────────────────────────────

function getScoreDisplay(score: number): Pick<CreditScoreResult, 'label' | 'sublabel' | 'color' | 'emoji'> {
  if (score >= 800) return {
    label: 'Excelente',
    sublabel: 'Tu historial financiero simulado es muy sólido. Sigue así.',
    color: '#10B981',
    emoji: '🌟',
  }
  if (score >= 650) return {
    label: 'Muy bueno',
    sublabel: 'Vas por el camino correcto. Pequeños ajustes te llevarán al siguiente nivel.',
    color: '#34D399',
    emoji: '💪',
  }
  if (score >= 500) return {
    label: 'Bueno',
    sublabel: 'Base sólida con espacio para crecer. Cada hábito que mejoras suma.',
    color: '#F59E0B',
    emoji: '📈',
  }
  if (score >= 350) return {
    label: 'En construcción',
    sublabel: 'Estás en proceso de construir tu salud financiera. No hay juicio aquí — solo oportunidades.',
    color: '#F97316',
    emoji: '🔨',
  }
  return {
    label: 'Iniciando',
    sublabel: 'El primer paso es la conciencia. Ya la tienes — eso es lo que importa.',
    color: '#EF4444',
    emoji: '🌱',
  }
}

// ── Impacto por factor score ──────────────────────────────────

function toImpact(s: number): FactorImpact {
  if (s >= 800) return 'excelente'
  if (s >= 650) return 'bueno'
  if (s >= 500) return 'regular'
  return 'bajo'
}

// ── Hook principal ────────────────────────────────────────────

export function useCreditScore(profile: Profile | null): CreditScoreResult | null {
  return useMemo(() => {
    if (!profile) return null

    const {
      monthly_income:      income,
      fixed_expenses:      fixed,
      variable_expenses:   variable,
      leisure_expenses:    leisure,
      monthly_debt_payment: monthlyDebt,
      emergency_fund:      fund,
    } = profile

    const allExpenses = fixed + variable + leisure + monthlyDebt
    const monthlyExp  = fixed + variable

    // ── Calcular pilares
    const debt      = debtPillar(income, monthlyDebt)
    const emergency = emergencyPillar(monthlyExp, fund)
    const savings   = savingsPillar(income, allExpenses)
    const leisure_  = leisurePillar(income, leisure)

    // ── Score combinado
    const raw = (
      debt.score      * W.debt      +
      emergency.score * W.emergency +
      savings.score   * W.savings   +
      leisure_.score  * W.leisure
    )
    const score = Math.max(150, Math.min(950, Math.round(raw)))

    // ── Factores para la UI
    const factors: ScoreFactor[] = [
      {
        id: 'debt',
        label: 'Carga de deuda',
        emoji: '💳',
        factorScore: debt.score,
        impact: toImpact(debt.score),
        weight: W.debt,
        currentValue: debt.value,
        interpretation: debt.interpretation,
      },
      {
        id: 'emergency',
        label: 'Fondo de emergencia',
        emoji: '🛡️',
        factorScore: emergency.score,
        impact: toImpact(emergency.score),
        weight: W.emergency,
        currentValue: emergency.value,
        interpretation: emergency.interpretation,
      },
      {
        id: 'savings',
        label: 'Tasa de ahorro',
        emoji: '💰',
        factorScore: savings.score,
        impact: toImpact(savings.score),
        weight: W.savings,
        currentValue: savings.value,
        interpretation: savings.interpretation,
      },
      {
        id: 'leisure',
        label: 'Control del ocio',
        emoji: '🎮',
        factorScore: leisure_.score,
        impact: toImpact(leisure_.score),
        weight: W.leisure,
        currentValue: leisure_.value,
        interpretation: leisure_.interpretation,
      },
    ]

    // ── Buenos hábitos
    const goodHabits: string[] = []
    if (monthlyDebt === 0) goodHabits.push('No tienes deudas registradas — excelente base')
    else if (income > 0 && monthlyDebt / income < 0.20) goodHabits.push('Tu deuda mensual está por debajo del 20% de tu ingreso')
    if (monthlyExp > 0 && fund / monthlyExp >= 3) goodHabits.push('Tu fondo de emergencia cubre al menos 3 meses de gastos')
    if (income > 0 && (income - allExpenses) / income >= 0.15) goodHabits.push('Ahorras más del 15% de tu ingreso mensual — hábito clave')
    if (income > 0 && leisure / income < 0.20) goodHabits.push('Tu gasto en ocio está bien controlado (< 20% del ingreso)')
    if (income > 0 && (income - allExpenses) > 0) goodHabits.push('Tienes flujo de caja positivo este mes')

    // ── Oportunidades de mejora
    const improvements: { text: string; impact: string }[] = []

    if (income > 0 && monthlyDebt / income >= 0.20) {
      improvements.push({
        text: 'Reducir la cuota mensual de deuda al 20% del ingreso',
        impact: `+${Math.round((730 - debt.score) * W.debt)} puntos estimados`,
      })
    }
    if (monthlyExp > 0 && fund / monthlyExp < 3) {
      const target = monthlyExp * 3 - fund
      improvements.push({
        text: `Completar el fondo de emergencia ($${target.toLocaleString('es-CO')} faltantes para 3 meses)`,
        impact: `+${Math.round((820 - emergency.score) * W.emergency)} puntos estimados`,
      })
    }
    if (income > 0 && (income - allExpenses) / income < 0.15) {
      improvements.push({
        text: 'Incrementar la tasa de ahorro al 15%+ del ingreso mensual',
        impact: `+${Math.round((800 - savings.score) * W.savings)} puntos estimados`,
      })
    }
    if (income > 0 && leisure / income >= 0.25) {
      improvements.push({
        text: 'Reducir ocio al 20% del ingreso (ahorro + eficiencia)',
        impact: `+${Math.round((760 - leisure_.score) * W.leisure)} puntos estimados`,
      })
    }

    return {
      score,
      ...getScoreDisplay(score),
      factors,
      goodHabits,
      improvements,
    }
  }, [profile])
}
