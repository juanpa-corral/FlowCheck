package com.flowcheck.model;

import io.hypersistence.utils.hibernate.type.array.StringArrayType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entidad que mapea la tabla {@code profiles} de Supabase.
 * Creada por el trigger {@code trg_on_auth_user_created} al registrarse un usuario.
 */
@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "university")
    private String university;

    @Column(name = "career")
    private String career;

    /** Estrato socioeconómico colombiano (1-6) */
    @Column(name = "stratum")
    private Integer stratum;

    // ── Ingresos ──────────────────────────────────────────────

    @Column(name = "monthly_income", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyIncome = BigDecimal.ZERO;

    @Type(StringArrayType.class)
    @Column(name = "income_sources", columnDefinition = "text[]")
    private String[] incomeSources;

    // ── Egresos ───────────────────────────────────────────────

    @Column(name = "fixed_expenses", nullable = false, precision = 12, scale = 2)
    private BigDecimal fixedExpenses = BigDecimal.ZERO;

    @Column(name = "variable_expenses", nullable = false, precision = 12, scale = 2)
    private BigDecimal variableExpenses = BigDecimal.ZERO;

    @Column(name = "leisure_expenses", nullable = false, precision = 12, scale = 2)
    private BigDecimal leisureExpenses = BigDecimal.ZERO;

    // ── Deuda ─────────────────────────────────────────────────

    @Column(name = "total_debt", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDebt = BigDecimal.ZERO;

    @Column(name = "monthly_debt_payment", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyDebtPayment = BigDecimal.ZERO;

    // ── Fondo de emergencia y metas ───────────────────────────

    @Column(name = "emergency_fund", nullable = false, precision = 12, scale = 2)
    private BigDecimal emergencyFund = BigDecimal.ZERO;

    @Column(name = "savings_goal", nullable = false, precision = 12, scale = 2)
    private BigDecimal savingsGoal = BigDecimal.ZERO;

    @Column(name = "savings_goal_months")
    private Integer savingsGoalMonths;

    // ── Perfil de riesgo ──────────────────────────────────────

    @Column(name = "risk_profile")
    private String riskProfile; // conservador | moderado | arriesgado

    // ── Estado y métricas ─────────────────────────────────────

    @Column(name = "onboarding_completed", nullable = false)
    private Boolean onboardingCompleted = false;

    @Column(name = "isf_score", precision = 5, scale = 2)
    private BigDecimal isfScore;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
