package com.flowcheck.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Resultado del cálculo del Índice de Salud Financiera (ISF).
 * No se almacena en la base de datos; se calcula bajo demanda.
 *
 * Componentes:
 *   savingsScore   (max 30): tasa de ahorro mensual
 *   leisureScore   (max 20): control de gasto en ocio
 *   emergencyScore (max 30): cobertura del fondo de emergencia
 *   debtScore      (max 20): carga de deuda sobre ingresos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ISFBreakdown {

    /** Puntaje total 0-100 */
    private double total;

    /** Componente de ahorro (0-30 pts) */
    private double savingsScore;

    /** Componente de ocio (0-20 pts) */
    private double leisureScore;

    /** Componente de fondo de emergencia (0-30 pts) */
    private double emergencyScore;

    /** Componente de deuda (0-20 pts) */
    private double debtScore;

    /** Etiqueta legible del nivel de salud */
    private String label;

    /** Mensaje motivacional sin juicios */
    private String message;
}
