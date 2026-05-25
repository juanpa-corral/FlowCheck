import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Tipos ─────────────────────────────────────────────────────

export interface CategoryComparison {
  category: string
  currentMonth: number
  prevMonth: number
  /** Porcentaje de cambio; null si prevMonth = 0 */
  changePct: number | null
  /** true = subió, false = bajó, null = sin dato anterior */
  increased: boolean | null
}

export interface MonthlyAnalytics {
  categories: CategoryComparison[]
  totalCurrentMonth: number
  totalPrevMonth: number
  incomeCurrentMonth: number
  incomePrevMonth: number
  /** Ahorro potencial mes actual */
  savingsCurrent: number
  /** Ahorro potencial mes anterior */
  savingsPrev: number
  /** Variación de ahorro en porcentaje */
  savingsChangePct: number | null
  /** Etiqueta legible del mes actual, ej: "Mayo 2026" */
  curMonthLabel: string
  prevMonthLabel: string
  /** Categoría con mayor aumento absoluto (para recomendación) */
  biggestIncrease: string | null
  recommendation: string | null
}

// ── Mapa de recomendaciones dinámicas ────────────────────────

const TIPS: Record<string, string> = {
  transporte:  '¿Mucho Uber este mes? Intenta salir 15 minutos antes para tomar SITP 🚌',
  ocio:        'El ocio aumentó este mes. ¿Pruebas actividades gratuitas? La ciclovía del domingo no cuesta nada 🚴',
  alimentacion:'La comida subió. Cocinar 2 veces a la semana puede ahorrarte hasta $80.000 al mes 🍳',
  servicios:   'Tus servicios aumentaron. ¿Cuántas suscripciones usas activamente? Un audit puede liberar $50.000+ 💡',
  suscripcion: 'Las suscripciones subieron. Revisa cuáles usas y cuáles solo pagan solos 📺',
  fijo:        'Tus gastos fijos aumentaron. ¿Hay alguno que puedas renegociar o eliminar? 🔒',
  salud:       'Más gastos de salud este mes. Recuerda que la EPS cubre muchas consultas sin costo extra 💊',
  educacion:   '¡Invertiste más en educación este mes! Sigue así, es la mejor inversión 🎓',
  otros:       'Hubo más gastos en "Otros". Intenta categorizar mejor para tener mayor claridad 📦',
}

function buildRecommendation(categories: CategoryComparison[]): { biggest: string | null; tip: string | null } {
  const increased = categories
    .filter((c) => c.currentMonth > c.prevMonth && c.prevMonth > 0)
    .sort((a, b) => (b.currentMonth - b.prevMonth) - (a.currentMonth - a.prevMonth))

  if (increased.length === 0) {
    const newOnes = categories.filter((c) => c.prevMonth === 0 && c.currentMonth > 0)
    if (newOnes.length > 0) {
      const cat = newOnes[0].category
      return { biggest: cat, tip: TIPS[cat] ?? null }
    }
    return {
      biggest: null,
      tip: '¡Excelente! Tus gastos bajaron vs. el mes pasado. Sigue con ese ritmo 🎯',
    }
  }
  const cat = increased[0].category
  return { biggest: cat, tip: TIPS[cat] ?? null }
}

// ── Hook ─────────────────────────────────────────────────────

export function useAnalytics(userId: string | undefined) {
  const [data, setData] = useState<MonthlyAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const { data: raw, error: err } = await supabase.rpc('get_monthly_comparison', {
      p_user_id: userId,
    })

    if (err) { setError(err.message); setLoading(false); return }

    const result = raw as {
      expenses: Array<{ category: string; current_month: number; prev_month: number }>
      income: { income_current: number; income_prev: number }
      cur_month: string
      prev_month: string
    }

    const categories: CategoryComparison[] = (result.expenses ?? []).map((row) => {
      const diff = row.current_month - row.prev_month
      const changePct =
        row.prev_month > 0
          ? Math.round((diff / row.prev_month) * 100)
          : null
      return {
        category:     row.category,
        currentMonth: row.current_month,
        prevMonth:    row.prev_month,
        changePct,
        increased:    changePct === null ? null : changePct > 0,
      }
    })

    const totalCurrent = categories.reduce((s, c) => s + c.currentMonth, 0)
    const totalPrev    = categories.reduce((s, c) => s + c.prevMonth, 0)
    const incomeCur    = result.income.income_current
    const incomePrev   = result.income.income_prev
    const savCur       = Math.max(0, incomeCur - totalCurrent)
    const savPrev      = Math.max(0, incomePrev - totalPrev)
    const savPct       = savPrev > 0 ? Math.round(((savCur - savPrev) / savPrev) * 100) : null

    const { biggest, tip } = buildRecommendation(categories)

    // Capitalizar labels del RPC ("mayo 2026" → "Mayo 2026")
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

    setData({
      categories,
      totalCurrentMonth:  totalCurrent,
      totalPrevMonth:     totalPrev,
      incomeCurrentMonth: incomeCur,
      incomePrevMonth:    incomePrev,
      savingsCurrent:     savCur,
      savingsPrev:        savPrev,
      savingsChangePct:   savPct,
      curMonthLabel:      cap(result.cur_month ?? ''),
      prevMonthLabel:     cap(result.prev_month ?? ''),
      biggestIncrease:    biggest,
      recommendation:     tip,
    })
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
