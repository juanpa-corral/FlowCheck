import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type PointReason =
  | 'daily_register'
  | 'pre_registro'
  | 'nudge_pause'
  | 'leisure_penalty'
  | 'redemption'

export interface RegisterResult {
  transactionId: string
  pointsEarned: number
  newTotalPoints: number
  leisurePenalty: boolean
  error: string | null
}

export interface RedeemResult {
  success: boolean
  rewardName: string
  pointsUsed: number
  newTotalPoints: number
  error: string | null
}

/**
 * Hook para operaciones atómicas de puntos vía RPCs de Supabase.
 * Las transacciones de puntos y registros financieros se ejecutan
 * en una sola función PostgreSQL para garantizar atomicidad.
 */
export function usePoints(userId: string | undefined) {

  /**
   * Registra un gasto/ingreso y otorga puntos en una sola transacción atómica.
   */
  const registerTransaction = useCallback(async (params: {
    amount: number
    category: string
    description: string
    date: string        // 'YYYY-MM-DD'
    type: 'income' | 'expense'
    nudgeUsed: boolean
    nudgePaused: boolean
  }): Promise<RegisterResult> => {
    if (!userId) return { transactionId: '', pointsEarned: 0, newTotalPoints: 0, leisurePenalty: false, error: 'No autenticado' }

    const { data, error } = await supabase.rpc('register_transaction', {
      p_user_id:      userId,
      p_amount:       params.amount,
      p_category:     params.category,
      p_description:  params.description,
      p_date:         params.date,
      p_type:         params.type,
      p_nudge_used:   params.nudgeUsed,
      p_nudge_paused: params.nudgePaused,
    })

    if (error) return { transactionId: '', pointsEarned: 0, newTotalPoints: 0, leisurePenalty: false, error: error.message }

    const result = data as { transaction_id: string; points_earned: number; new_total_points: number; leisure_penalty: boolean }
    return {
      transactionId:   result.transaction_id,
      pointsEarned:    result.points_earned,
      newTotalPoints:  result.new_total_points,
      leisurePenalty:  result.leisure_penalty,
      error: null,
    }
  }, [userId])

  /**
   * Canjea una recompensa del marketplace de forma atómica.
   */
  const redeemReward = useCallback(async (rewardId: string): Promise<RedeemResult> => {
    if (!userId) return { success: false, rewardName: '', pointsUsed: 0, newTotalPoints: 0, error: 'No autenticado' }

    const { data, error } = await supabase.rpc('redeem_reward', {
      p_user_id:  userId,
      p_reward_id: rewardId,
    })

    if (error) return { success: false, rewardName: '', pointsUsed: 0, newTotalPoints: 0, error: error.message }

    const result = data as { success: boolean; reward_name: string; points_used: number; new_total_points: number; error?: string }
    if (!result.success) return { success: false, rewardName: '', pointsUsed: 0, newTotalPoints: 0, error: result.error ?? 'Error desconocido' }

    return {
      success:         true,
      rewardName:      result.reward_name,
      pointsUsed:      result.points_used,
      newTotalPoints:  result.new_total_points,
      error: null,
    }
  }, [userId])

  return { registerTransaction, redeemReward }
}

// ── Utilidades de nivel ───────────────────────────────────────

export function getLevelInfo(points: number): { level: number; name: string; emoji: string; nextLevelPts: number; progress: number } {
  const levels = [
    { min: 0,    max: 499,   level: 1, name: 'Comenzando',       emoji: '🌱' },
    { min: 500,  max: 999,   level: 2, name: 'Avanzando',        emoji: '📈' },
    { min: 1000, max: 1999,  level: 3, name: 'Disciplinado',     emoji: '💪' },
    { min: 2000, max: 4999,  level: 4, name: 'Experto',          emoji: '🏆' },
    { min: 5000, max: 99999, level: 5, name: 'Maestro Financiero',emoji: '🌟' },
  ]

  const current = levels.find(l => points >= l.min && points <= l.max) ?? levels[levels.length - 1]
  const nextLevelPts = current.level < 5 ? levels[current.level].min : 5000
  const progress = current.level < 5
    ? ((points - current.min) / (nextLevelPts - current.min)) * 100
    : 100

  return { ...current, nextLevelPts, progress: Math.min(100, progress) }
}
