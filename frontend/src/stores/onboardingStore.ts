import { create } from 'zustand'
import type { RiskProfile, IncomeSource } from '../types/database'

export interface OnboardingData {
  // Step 1 — Identidad
  fullName: string
  university: string
  career: string
  stratum: number | null

  // Step 2 — Ingresos
  monthlyIncome: string
  incomeSources: IncomeSource[]

  // Step 3 — Egresos
  fixedExpenses: string
  variableExpenses: string
  leisureExpenses: string

  // Step 4 — Deuda
  totalDebt: string
  monthlyDebtPayment: string
  emergencyFund: string

  // Step 5 — Metas
  savingsGoal: string
  savingsGoalMonths: string

  // Step 6 — Perfil de riesgo
  riskProfile: RiskProfile | null
}

const initialData: OnboardingData = {
  fullName: '',
  university: '',
  career: '',
  stratum: null,
  monthlyIncome: '',
  incomeSources: [],
  fixedExpenses: '',
  variableExpenses: '',
  leisureExpenses: '',
  totalDebt: '',
  monthlyDebtPayment: '',
  emergencyFund: '',
  savingsGoal: '',
  savingsGoalMonths: '',
  riskProfile: null,
}

interface OnboardingState {
  currentStep: number
  data: OnboardingData
  setStep: (step: number) => void
  updateData: (patch: Partial<OnboardingData>) => void
  toggleIncomeSource: (source: IncomeSource) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  data: initialData,

  setStep: (step) => set({ currentStep: step }),

  updateData: (patch) =>
    set((state) => ({ data: { ...state.data, ...patch } })),

  toggleIncomeSource: (source) =>
    set((state) => {
      const sources = state.data.incomeSources
      const next = sources.includes(source)
        ? sources.filter((s) => s !== source)
        : [...sources, source]
      return { data: { ...state.data, incomeSources: next } }
    }),

  reset: () => set({ currentStep: 1, data: initialData }),
}))

export const TOTAL_STEPS = 6
