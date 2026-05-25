import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { useISF } from '../../hooks/useISF'
import { useLessons } from '../../hooks/useLessons'
import { usePenalties } from '../../hooks/usePenalties'
import { useTransactions } from '../../hooks/useTransactions'
import { ISFCard } from '../../components/ISFCard'
import { Semaphore } from '../../components/Semaphore'
import { LessonCard } from '../../components/LessonCard'
import { WeeklyChallenges } from '../../components/WeeklyChallenges'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Toast } from '../../components/Toast'
import { GhostExpensesWidget } from '../../components/GhostExpensesWidget'
import { Colors, Font, Radius } from '../../constants/theme'
import { getLevelInfo } from '../../hooks/usePoints'

// ── Helpers de tiempo ─────────────────────────────────────────

function greeting(name: string): string {
  const h = new Date().getHours()
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return `${saludo}, ${name.split(' ')[0]}`
}

function formattedDate(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

// ── Página ────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate  = useNavigate()
  const { session } = useAuthStore()
  const { profile, loading, refetch } = useProfile(session?.user?.id)
  const { ghostTotal, totalSpent } = useTransactions(session?.user?.id)
  // El semáforo usa el gasto real del mes para que cambie al registrar transacciones
  const isfResult  = useISF(profile ?? null, totalSpent)
  const { contextualLessons } = useLessons(profile ?? null)
  const penalties  = usePenalties(session?.user?.id)
  const [penaltyToast, setPenaltyToast] = useState<string | null>(null)

  React.useEffect(() => {
    if (penalties.toast) setPenaltyToast(penalties.toast)
  }, [penalties.toast])

  // Redirigir a onboarding si no está completo
  if (!loading && profile && !profile.onboarding_completed) {
    navigate('/onboarding/1', { replace: true })
    return null
  }

  if (loading || !profile) {
    return <LoadingSpinner fullScreen message="Cargando tu salud financiera…" />
  }

  const totalExpenses = profile.fixed_expenses + profile.variable_expenses + profile.leisure_expenses
  const savingsNet    = Math.max(0, profile.monthly_income - totalExpenses - profile.monthly_debt_payment)
  const spentPct      = profile.monthly_income > 0
    ? Math.min(100, Math.round((totalExpenses / profile.monthly_income) * 100))
    : 0
  const levelInfo     = getLevelInfo(profile.total_points ?? 0)

  return (
    <div style={{ backgroundColor: Colors.background, minHeight: '100dvh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 20px 12px' }}>

        {/* ── Saludo ── */}
        <div>
          <p style={{ fontSize: 22, fontWeight: 800, color: Colors.textPrimary, margin: '0 0 2px' }}>
            {greeting(profile.full_name)} 👋
          </p>
          <p style={{ fontSize: 13, color: Colors.textSecondary, margin: 0, textTransform: 'capitalize' }}>
            {formattedDate()}
          </p>
        </div>

        {/* ── Hero: Balance del mes ── */}
        <div
          style={{
            background: `linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%)`,
            borderRadius: 20,
            padding: 20,
            boxShadow: `0 8px 24px var(--c-primary-a30)`,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Potencial de ahorro este mes
          </p>
          <p style={{ fontSize: 34, fontWeight: 800, color: '#ffffff', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            {fmt(savingsNet)}
          </p>

          {/* Barra de gasto vs ingreso */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Comprometido</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{spentPct}%</span>
            </div>
            <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${spentPct}%`,
                  backgroundColor: spentPct > 75 ? '#FBBF24' : '#ffffff',
                  borderRadius: 3,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>

          {/* Stats inline */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Ingreso', value: fmt(profile.monthly_income), emoji: '💰' },
              { label: 'Gastos',  value: fmt(totalExpenses),          emoji: '📉' },
            ].map((s) => (
              <div key={s.label}
                style={{
                  flex: 1, backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '8px 10px',
                }}
              >
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 2px' }}>{s.emoji} {s.label}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ISF Card ── */}
        {isfResult && <ISFCard breakdown={isfResult.breakdown} />}

        {/* ── Semáforo ── */}
        {isfResult && <Semaphore data={isfResult.semaphore} />}

        {/* ── Meta de ahorro ── */}
        {profile.savings_goal > 0 && (
          <div
            style={{
              backgroundColor: Colors.primaryLight,
              borderRadius: Radius.card,
              padding: 16,
              display: 'flex', alignItems: 'center', gap: 14,
              border: `1px solid ${Colors.primaryA30}`,
            }}
          >
            <span style={{ fontSize: 32 }}>🎯</span>
            <div>
              <p style={{ fontSize: 13, color: Colors.primary, fontWeight: 600, margin: '0 0 2px' }}>Tu meta de ahorro</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: Colors.primary, margin: '0 0 2px' }}>
                {fmt(profile.savings_goal)}
              </p>
              {profile.savings_goal_months && (
                <p style={{ fontSize: 12, color: Colors.textSecondary, margin: 0 }}>
                  en {profile.savings_goal_months} meses
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Nivel & Puntos ── */}
        <div
          style={{
            backgroundColor: Colors.card,
            borderRadius: Radius.card,
            padding: 16,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: `1px solid ${Colors.border}`,
          }}
        >
          <div
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}
          >
            {levelInfo.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
              {levelInfo.name}
            </p>
            <p style={{ fontSize: 11, color: Colors.textMuted, margin: '0 0 6px' }}>
              ⭐ {(profile.total_points ?? 0).toLocaleString('es-CO')} pts
            </p>
            {/* Progress bar to next level */}
            <div style={{ height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', width: `${levelInfo.progress}%`,
                  backgroundColor: Colors.primary, borderRadius: 3,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: Colors.textMuted, margin: '0 0 2px' }}>Siguiente</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: Colors.primary, margin: 0 }}>
              {levelInfo.nextLevelPts.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        {/* ── Acceso rápido: Mi Mes ── */}
        <button
          onClick={() => navigate('/analitica')}
          style={{
            backgroundColor: Colors.card,
            borderRadius: Radius.card,
            padding: '14px 16px',
            border: `1px solid ${Colors.border}`,
            cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <span style={{ fontSize: 26 }}>📈</span>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>Mi Mes Financiero</p>
            <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0 }}>Comparativa mes actual vs anterior</p>
          </div>
          <span style={{ fontSize: 16, color: Colors.textMuted }}>→</span>
        </button>

        {/* ── Widget Gastos Fantasma ── */}
        <GhostExpensesWidget
          monthlyGhostTotal={ghostTotal}
          onSeeDetail={() => navigate('/analitica')}
        />

        {/* ── Retos semanales ── */}
        <WeeklyChallenges userId={session?.user?.id} />

        {/* ── Lecciones contextuales ── */}
        {contextualLessons.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
                ⚡ Para ti ahora
              </p>
              <button
                onClick={() => navigate('/educacion')}
                style={{ background: 'none', border: 'none', fontSize: 12, color: Colors.primary, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Ver todas →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contextualLessons.slice(0, 2).map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => navigate('/educacion')}
                  highlight={lesson.priority === 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Actualizar datos ── */}
        <button
          onClick={refetch}
          style={{
            border: `1.5px solid ${Colors.border}`,
            borderRadius: Radius.button,
            padding: 12,
            backgroundColor: Colors.card,
            color: Colors.textSecondary,
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          🔄 Actualizar datos
        </button>

      </div>

      {/* ── Toast de penalización ── */}
      {penaltyToast && (
        <Toast
          message={penaltyToast}
          type="warning"
          duration={5000}
          onDismiss={() => setPenaltyToast(null)}
        />
      )}
    </div>
  )
}
