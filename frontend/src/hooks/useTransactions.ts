import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types/database'

// ── Helpers de fecha ──────────────────────────────────────────

function getMonthRange(offsetMonths = 0): { from: string; to: string } {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1)
  const end   = new Date(start.getFullYear(), start.getMonth() + 1, 0) // último día
  const fmt   = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(start), to: fmt(end) }
}

// ── Hook ──────────────────────────────────────────────────────

/**
 * Carga las transacciones del mes actual (y opcionalmente anteriores)
 * con una suscripción Realtime para reflejar nuevos registros
 * instantáneamente sin recargar la pantalla.
 */
export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCurrent = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const { from, to } = getMonthRange(0)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', from)
      .lte('transaction_date', to)
      .order('transaction_date', { ascending: false })
    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [userId])

  // Carga inicial
  useEffect(() => { fetchCurrent() }, [fetchCurrent])

  // ── Realtime: INSERT en transactions ──────────────────────────
  // Cuando se registra un nuevo movimiento (vía RPC o directo),
  // lo inyecta al inicio de la lista sin re-fetch completo.
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`txn:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newTx = payload.new as Transaction
          // Solo incorporar si es del mes actual (puede llegar de otro dispositivo)
          const { from, to } = getMonthRange(0)
          if (newTx.transaction_date >= from && newTx.transaction_date <= to) {
            setTransactions((prev) => {
              // Evitar duplicados (el evento puede llegar 2 veces en dev)
              if (prev.some((t) => t.id === newTx.id)) return prev
              return [newTx, ...prev]
            })
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // ── Derivados útiles ──────────────────────────────────────────

  const expenses  = transactions.filter((t) => t.type === 'expense')
  const incomes   = transactions.filter((t) => t.type === 'income')
  const totalSpent  = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)

  /** Gastos por categoría este mes */
  const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})

  /** Gastos de suscripciones + fijos (para widget de gastos fantasma) */
  const ghostExpenses = expenses.filter((t) =>
    t.category === 'suscripcion' || t.category === 'fijo' || t.category === 'servicios',
  )
  const ghostTotal = ghostExpenses.reduce((s, t) => s + t.amount, 0)

  return {
    transactions,
    expenses,
    incomes,
    totalSpent,
    totalIncome,
    byCategory,
    ghostTotal,
    loading,
    refetch: fetchCurrent,
  }
}
