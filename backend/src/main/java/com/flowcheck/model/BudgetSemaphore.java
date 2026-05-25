package com.flowcheck.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Resultado del semáforo de presupuesto.
 * Calcula qué porcentaje del ingreso está comprometido en gastos fijos.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSemaphore {

    /** Estado: "verde" | "amarillo" | "rojo" */
    private String status;

    /** Porcentaje del ingreso comprometido (0-100+) */
    private double percentage;

    /** Monto total comprometido en gastos mensuales */
    private double committed;

    /** Ingreso mensual del usuario */
    private double income;

    /** Monto disponible tras gastos (income - committed) */
    private double available;

    /** Mensaje contextual al usuario */
    private String message;
}
