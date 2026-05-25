import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Tipos ─────────────────────────────────────────────────────

export interface PenaltyResult {
  streakPenalty: boolean
  riskPenalty: boolean
  totalDeduction: number
  newTotalPoints: number
}

export interface PenaltyState {
  checked: boolean
  result: PenaltyResult | null
  /** Mensaje de toast si hubo penalizaciones */
  toast: string | null
}

// ── Clave localStorage para anti-duplicado de UI ─────────────
const LS_KEY = (uid: string) => `fc_penalty_checked_${uid}_${new Date().toISOString().slice(0, 10)}`

// ── Hook ──────────────────────────────────────────────────────

/**
 * Se ejecuta una vez por sesión de app (al montar el Dashboard).
 * Llama al RPC check_and_apply_penalties y devuelve el resultado.
 *
 * El localStorage evita que la consulta se repita si el usuario
 * sale y vuelve al dashboard en la misma sesión del día.
 * La deduplicación real (anti-doble-cobro) vive en el RPC de Supabase.
 */
export function usePenalties(userId: string | undefined): PenaltyState {
  const [state, setState] = useState<PenaltyState>({ checked: false, result: null, toast: null })
  const called = useRef(false)

  useEffect(() => {
    if (!userId || called.current) return
    called.current = true

    // Si ya chequeamos hoy en esta sesión, no volver a mostrar el toast
    const lsKey = LS_KEY(userId)
    if (localStorage.getItem(lsKey)) {
      setState({ checked: true, result: null, toast: null })
      return
    }

    supabase
      .rpc('check_and_apply_penalties', { p_user_id: userId })
      .then(({ data, error }) => {
        if (error || !data) {
          setState({ checked: true, result: null, toast: null })
          return
        }

        const raw = data as {
          streak_penalty:   boolean
          risk_penalty:     boolean
          total_deduction:  number
          new_total_points: number
        }

        const result: PenaltyResult = {
          streakPenalty:  raw.streak_penalty,
          riskPenalty:    raw.risk_penalty,
          totalDeduction: raw.total_deduction,
          newTotalPoints: raw.new_total_points,
        }

        let toast: string | null = null
        if (raw.streak_penalty) {
          toast = '¡Ups! Perdiste tu racha. Registra un gasto para detener la fuga de puntos 🛡️'
        } else if (raw.risk_penalty) {
          toast = '⚠️ -15 pts: Tu ocio supera el 25% sin fondo de emergencia. ¡Podemos mejorar esto!'
        }

        // Marcar como chequeado hoy para no mostrar el toast de nuevo
        localStorage.setItem(lsKey, '1')

        setState({ checked: true, result, toast })
      })
  }, [userId])

  return state
}
