package com.flowcheck.service;

import com.flowcheck.model.BudgetSemaphore;
import com.flowcheck.model.ISFBreakdown;
import com.flowcheck.model.Profile;
import org.springframework.stereotype.Service;

/**
 * Servicio que implementa el cálculo del Índice de Salud Financiera (ISF).
 *
 * Lógica idéntica al frontend (src/hooks/useISF.ts) para garantizar
 * consistencia entre la versión web y la API.
 *
 * Componentes del ISF (total 100 puntos):
 *   savingsScore   (max 30): tasa de ahorro mensual
 *   leisureScore   (max 20): control de gasto en ocio
 *   emergencyScore (max 30): cobertura del fondo de emergencia
 *   debtScore      (max 20): carga de deuda sobre ingresos
 */
@Service
public class ISFService {

    // ── Umbrales del semáforo ────────────────────────────────────────────

    private static final double SEMAPHORE_GREEN  = 50.0; // < 50% → verde
    private static final double SEMAPHORE_YELLOW = 75.0; // 50-75% → amarillo
    // > 75% → rojo

    // ── Cálculo del ISF ──────────────────────────────────────────────────

    public ISFBreakdown calculate(Profile p) {
        double income       = toDouble(p.getMonthlyIncome());
        double fixed        = toDouble(p.getFixedExpenses());
        double variable     = toDouble(p.getVariableExpenses());
        double leisure      = toDouble(p.getLeisureExpenses());
        double emergencyFund= toDouble(p.getEmergencyFund());
        double monthlyDebt  = toDouble(p.getMonthlyDebtPayment());

        double totalExpenses = fixed + variable + leisure + monthlyDebt;

        double savingsScore   = calcSavingsScore(income, totalExpenses);
        double leisureScore   = calcLeisureScore(income, leisure);
        double emergencyScore = calcEmergencyScore(fixed + variable, emergencyFund);
        double debtScore      = calcDebtScore(income, monthlyDebt);

        double total = Math.min(100.0, savingsScore + leisureScore + emergencyScore + debtScore);

        return ISFBreakdown.builder()
                .total(total)
                .savingsScore(savingsScore)
                .leisureScore(leisureScore)
                .emergencyScore(emergencyScore)
                .debtScore(debtScore)
                .label(getLabel(total))
                .message(getMessage(total))
                .build();
    }

    public BudgetSemaphore calculateSemaphore(Profile p) {
        double income      = toDouble(p.getMonthlyIncome());
        double fixed       = toDouble(p.getFixedExpenses());
        double variable    = toDouble(p.getVariableExpenses());
        double leisure     = toDouble(p.getLeisureExpenses());
        double monthlyDebt = toDouble(p.getMonthlyDebtPayment());

        double committed   = fixed + variable + leisure + monthlyDebt;
        double percentage  = income > 0 ? (committed / income) * 100.0 : 0.0;
        double available   = Math.max(0.0, income - committed);

        String status;
        String message;

        if (percentage <= SEMAPHORE_GREEN) {
            status  = "verde";
            message = "Tu presupuesto tiene buena salud. ¡Sigue así!";
        } else if (percentage <= SEMAPHORE_YELLOW) {
            status  = "amarillo";
            message = "Tus gastos consumen buena parte del ingreso. Revisa dónde puedes optimizar.";
        } else {
            status  = "rojo";
            message = "Tus compromisos superan el límite recomendado. Hagamos un plan juntos.";
        }

        return BudgetSemaphore.builder()
                .status(status)
                .percentage(percentage)
                .committed(committed)
                .income(income)
                .available(available)
                .message(message)
                .build();
    }

    // ── Componentes del ISF ──────────────────────────────────────────────

    private double calcSavingsScore(double income, double totalExpenses) {
        if (income <= 0) return 0;
        double rate = (income - totalExpenses) / income;
        if (rate >= 0.20) return 30;
        if (rate >= 0.10) return 20;
        if (rate >= 0.05) return 10;
        return 0;
    }

    private double calcLeisureScore(double income, double leisure) {
        if (income <= 0) return 0;
        double rate = leisure / income;
        if (rate < 0.10) return 20;
        if (rate < 0.20) return 15;
        if (rate < 0.30) return 10;
        return 0;
    }

    private double calcEmergencyScore(double monthlyExpenses, double fund) {
        if (monthlyExpenses <= 0) return 30;
        double months = fund / monthlyExpenses;
        if (months >= 3) return 30;
        if (months >= 2) return 20;
        if (months >= 1) return 10;
        return 0;
    }

    private double calcDebtScore(double income, double monthlyDebt) {
        if (income <= 0) return 0;
        double rate = monthlyDebt / income;
        if (rate < 0.20) return 20;
        if (rate < 0.30) return 10;
        if (rate < 0.40) return 5;
        return 0;
    }

    // ── Etiquetas ────────────────────────────────────────────────────────

    private String getLabel(double score) {
        if (score >= 80) return "Salud Excelente";
        if (score >= 60) return "Salud Buena";
        if (score >= 40) return "Salud Moderada";
        return "Necesita Atención";
    }

    private String getMessage(double score) {
        if (score >= 80) return "¡Vas increíble! Tu disciplina financiera está dando frutos.";
        if (score >= 60) return "Buen camino. Pequeños ajustes pueden llevarte al siguiente nivel.";
        if (score >= 40) return "Hay oportunidades de mejora. Empecemos con un paso a la vez.";
        return "Juntos podemos fortalecer tu salud financiera. ¡Sin juicios, solo avanzamos!";
    }

    // ── Utilidad ─────────────────────────────────────────────────────────

    private double toDouble(java.math.BigDecimal bd) {
        return bd == null ? 0.0 : bd.doubleValue();
    }
}
