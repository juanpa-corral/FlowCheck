import type { Profile } from '../../types/database'

/**
 * Perfil base realista para pruebas.
 * Ingreso: $2.000.000 · Gastos controlados · Fondo de emergencia OK
 */
export const mockProfile: Profile = {
  id: 'test-user-id',
  full_name: 'Ana García López',
  university: 'Universidad de los Andes',
  career: 'Administración de Empresas',
  stratum: 3,
  monthly_income: 2_000_000,
  income_sources: ['beca', 'trabajo_parcial'],
  fixed_expenses:    500_000,
  variable_expenses: 300_000,
  leisure_expenses:  150_000,
  total_debt: 0,
  monthly_debt_payment: 0,
  emergency_fund: 2_400_000,  // ~4 meses de (fixed + variable)
  savings_goal: 5_000_000,
  savings_goal_months: 12,
  risk_profile: 'moderado',
  onboarding_completed: true,
  isf_score: 75,
  total_points: 350,
  level: 1,
  last_activity_at: '2024-01-15T10:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

/** Perfil con ocio alto y sin fondo de emergencia (activa penalización) */
export const highLeisureProfile: Profile = {
  ...mockProfile,
  id: 'high-leisure-user',
  monthly_income: 1_000_000,
  leisure_expenses: 350_000,   // 35% del ingreso > umbral 30%
  fixed_expenses:   200_000,
  variable_expenses: 100_000,
  emergency_fund:   200_000,   // < (fixed + variable) = 300k → sin fondo adecuado
}

/** Perfil con deuda alta */
export const highDebtProfile: Profile = {
  ...mockProfile,
  id: 'high-debt-user',
  monthly_income: 1_000_000,
  monthly_debt_payment: 450_000, // 45% del ingreso
  fixed_expenses: 200_000,
  variable_expenses: 100_000,
  leisure_expenses: 50_000,
}

/** Perfil ideal que debería puntuar 100 en el ISF */
export const perfectProfile: Profile = {
  ...mockProfile,
  id: 'perfect-user',
  monthly_income:       1_000_000,
  fixed_expenses:         100_000,
  variable_expenses:      100_000,
  leisure_expenses:        50_000,
  monthly_debt_payment:    50_000,
  emergency_fund:         900_000, // 4.5 meses
}
