// ============================================================
// FlowCheck 2.0 — Hook: Gestor de Cuentas / Bolsillos
// CRUD completo conectado a Supabase con estado local reactivo
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// ── Tipos ─────────────────────────────────────────────────────

export type AccountType = 'efectivo' | 'banco' | 'tarjeta_credito'

export interface Account {
  id:           string
  user_id:      string
  name:         string
  type:         AccountType
  balance:      number
  credit_limit: number | null    // solo para tarjeta_credito
  icon:         string
  color:        string
  is_active:    boolean
  created_at:   string
  updated_at:   string
}

export type AccountInput = Omit<Account, 'id' | 'user_id' | 'is_active' | 'created_at' | 'updated_at'>

export interface AccountResult {
  data: Account | null
  error: string | null
}

// ── Defaults por tipo ─────────────────────────────────────────

export const ACCOUNT_DEFAULTS: Record<AccountType, { icon: string; color: string; label: string }> = {
  efectivo:        { icon: '💵', color: '#1D9E75', label: 'Efectivo' },
  banco:           { icon: '🏦', color: '#157A5A', label: 'Cuenta Bancaria' },
  tarjeta_credito: { icon: '💳', color: '#E24B4A', label: 'Tarjeta de Crédito' },
}

// ── Hook principal ────────────────────────────────────────────

export function useAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // ── Fetch ─────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const { data, error: err } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (err) {
      setError(err.message)
    } else {
      setAccounts((data as Account[]) ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  // ── Create ────────────────────────────────────────────────

  const createAccount = useCallback(async (input: AccountInput): Promise<AccountResult> => {
    if (!userId) return { data: null, error: 'No autenticado' }

    const { data, error: err } = await supabase
      .from('accounts')
      .insert({ ...input, user_id: userId })
      .select()
      .single()

    if (err) return { data: null, error: err.message }

    const newAccount = data as Account
    setAccounts((prev) => [...prev, newAccount])
    return { data: newAccount, error: null }
  }, [userId])

  // ── Update ────────────────────────────────────────────────

  const updateAccount = useCallback(async (
    id: string,
    patch: Partial<AccountInput>,
  ): Promise<{ error: string | null }> => {
    const { error: err } = await supabase
      .from('accounts')
      .update(patch)
      .eq('id', id)

    if (err) return { error: err.message }

    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    )
    return { error: null }
  }, [])

  // ── Update Balance ────────────────────────────────────────

  const updateBalance = useCallback(async (
    id: string,
    newBalance: number,
  ): Promise<{ error: string | null }> => {
    return updateAccount(id, { balance: newBalance })
  }, [updateAccount])

  // ── Delete (soft) ─────────────────────────────────────────

  const deleteAccount = useCallback(async (
    id: string,
  ): Promise<{ error: string | null }> => {
    const { error: err } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)

    if (err) return { error: err.message }

    setAccounts((prev) => prev.filter((a) => a.id !== id))
    return { error: null }
  }, [])

  // ── Transfer between accounts ─────────────────────────────

  const transfer = useCallback(async (
    fromId: string,
    toId: string,
    amount: number,
  ): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'No autenticado' }

    const { data, error: err } = await supabase.rpc('transfer_between_accounts', {
      p_user_id: userId,
      p_from_id: fromId,
      p_to_id:   toId,
      p_amount:  amount,
    })

    if (err) return { error: err.message }

    const result = data as { success: boolean; error?: string }
    if (!result.success) return { error: result.error ?? 'Error en transferencia' }

    // Refetch to get updated balances
    await fetchAccounts()
    return { error: null }
  }, [userId, fetchAccounts])

  // ── Valores derivados ─────────────────────────────────────

  const derived = useMemo(() => {
    const assets = accounts
      .filter((a) => a.type !== 'tarjeta_credito')
      .reduce((sum, a) => sum + a.balance, 0)

    const creditDebt = accounts
      .filter((a) => a.type === 'tarjeta_credito')
      .reduce((sum, a) => sum + a.balance, 0)

    const creditLimit = accounts
      .filter((a) => a.type === 'tarjeta_credito' && a.credit_limit)
      .reduce((sum, a) => sum + (a.credit_limit ?? 0), 0)

    const netWorth = assets - creditDebt

    // Utilización de crédito (alerta > 30%, crítico > 70%)
    const creditUtilization = creditLimit > 0 ? (creditDebt / creditLimit) * 100 : 0

    return { assets, creditDebt, creditLimit, netWorth, creditUtilization }
  }, [accounts])

  return {
    accounts,
    loading,
    error,
    ...derived,
    createAccount,
    updateAccount,
    updateBalance,
    deleteAccount,
    transfer,
    refetch: fetchAccounts,
  }
}
