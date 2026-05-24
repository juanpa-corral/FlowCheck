import { useMemo } from 'react';
import type { Profile, ISFBreakdown, BudgetSemaphore } from '../types/database';
import { SEMAPHORE_THRESHOLDS } from '../constants/theme';

// ============================================================
// Índice de Salud Financiera (ISF) — 0 a 100 puntos
//
// Componentes:
//   savingsScore   (30 pts): tasa de ahorro mensual
//   leisureScore   (20 pts): control de gasto en ocio
//   emergencyScore (30 pts): cobertura del fondo de emergencia
//   debtScore      (20 pts): carga de deuda sobre ingresos
// ============================================================

function calcSavingsScore(income: number, totalExpenses: number): number {
  if (income <= 0) return 0;
  const rate = (income - totalExpenses) / income;
  if (rate >= 0.2) return 30;
  if (rate >= 0.1) return 20;
  if (rate >= 0.05) return 10;
  return 0;
}

function calcLeisureScore(income: number, leisure: number): number {
  if (income <= 0) return 0;
  const rate = leisure / income;
  if (rate < 0.1) return 20;
  if (rate < 0.2) return 15;
  if (rate < 0.3) return 10;
  return 0;
}

function calcEmergencyScore(monthlyExpenses: number, fund: number): number {
  if (monthlyExpenses <= 0) return 30;
  const months = fund / monthlyExpenses;
  if (months >= 3) return 30;
  if (months >= 2) return 20;
  if (months >= 1) return 10;
  return 0;
}

function calcDebtScore(income: number, monthlyDebt: number): number {
  if (income <= 0) return 0;
  const rate = monthlyDebt / income;
  if (rate < 0.2) return 20;
  if (rate < 0.3) return 10;
  if (rate < 0.4) return 5;
  return 0;
}

export function calculateISF(profile: Profile): ISFBreakdown {
  const {
    monthly_income: income,
    fixed_expenses,
    variable_expenses,
    leisure_expenses,
    emergency_fund,
    monthly_debt_payment,
  } = profile;

  const totalExpenses =
    fixed_expenses + variable_expenses + leisure_expenses + monthly_debt_payment;

  const savingsScore = calcSavingsScore(income, totalExpenses);
  const leisureScore = calcLeisureScore(income, leisure_expenses);
  const emergencyScore = calcEmergencyScore(
    fixed_expenses + variable_expenses,
    emergency_fund,
  );
  const debtScore = calcDebtScore(income, monthly_debt_payment);

  const total = Math.min(
    100,
    savingsScore + leisureScore + emergencyScore + debtScore,
  );

  return { total, savingsScore, leisureScore, emergencyScore, debtScore };
}

export function calculateSemaphore(profile: Profile): BudgetSemaphore {
  const {
    monthly_income: income,
    fixed_expenses,
    variable_expenses,
    leisure_expenses,
    monthly_debt_payment,
  } = profile;

  const committed =
    fixed_expenses + variable_expenses + leisure_expenses + monthly_debt_payment;
  const percentage = income > 0 ? (committed / income) * 100 : 0;

  let status: BudgetSemaphore['status'];
  if (percentage <= SEMAPHORE_THRESHOLDS.green) {
    status = 'verde';
  } else if (percentage <= SEMAPHORE_THRESHOLDS.yellow) {
    status = 'amarillo';
  } else {
    status = 'rojo';
  }

  return { status, percentage, committed, income };
}

export function getISFLabel(score: number): string {
  if (score >= 80) return 'Salud Excelente';
  if (score >= 60) return 'Salud Buena';
  if (score >= 40) return 'Salud Moderada';
  return 'Necesita Atención';
}

export function getISFMessage(score: number): string {
  if (score >= 80) return '¡Vas increíble! Tu disciplina financiera está dando frutos.';
  if (score >= 60) return 'Buen camino. Pequeños ajustes pueden llevarte al siguiente nivel.';
  if (score >= 40) return 'Hay oportunidades de mejora. Empecemos con un paso a la vez.';
  return 'Juntos podemos fortalecer tu salud financiera. ¡Sin juicios, solo avanzamos!';
}

export function useISF(profile: Profile | null) {
  return useMemo(() => {
    if (!profile) return null;
    return {
      breakdown: calculateISF(profile),
      semaphore: calculateSemaphore(profile),
    };
  }, [profile]);
}
