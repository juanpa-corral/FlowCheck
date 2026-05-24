// ============================================================
// FlowCheck 2.0 — Interfaces de Supabase (TypeScript estricto)
// ============================================================

export type RiskProfile = 'conservador' | 'moderado' | 'arriesgado';
export type TransactionType = 'income' | 'expense';
export type SemaphoreStatus = 'verde' | 'amarillo' | 'rojo';

export type BudgetCategory =
  | 'alimentacion'
  | 'transporte'
  | 'ocio'
  | 'educacion'
  | 'salud'
  | 'servicios'
  | 'otros';

export interface Profile {
  id: string;
  full_name: string;
  university: string | null;
  career: string | null;
  stratum: number | null;
  monthly_income: number;
  income_sources: string[] | null;
  fixed_expenses: number;
  variable_expenses: number;
  leisure_expenses: number;
  total_debt: number;
  monthly_debt_payment: number;
  emergency_fund: number;
  savings_goal: number;
  savings_goal_months: number | null;
  risk_profile: RiskProfile | null;
  onboarding_completed: boolean;
  isf_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: BudgetCategory;
  allocated_amount: number;
  month: number;
  year: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: BudgetCategory | string;
  description: string | null;
  transaction_date: string;
  type: TransactionType;
  is_planned: boolean;
  created_at: string;
}

// ---- Tipos calculados (no se almacenan en DB) ----

export interface ISFBreakdown {
  total: number;        // 0-100
  savingsScore: number; // max 30: tasa de ahorro
  leisureScore: number; // max 20: control de ocio
  emergencyScore: number; // max 30: fondo de emergencia
  debtScore: number;    // max 20: carga de deuda
}

export interface BudgetSemaphore {
  status: SemaphoreStatus;
  percentage: number; // 0-100+
  committed: number;  // gastos comprometidos del perfil
  income: number;
}

export type IncomeSource =
  | 'beca'
  | 'trabajo_parcial'
  | 'apoyo_familiar'
  | 'freelance'
  | 'otro';
