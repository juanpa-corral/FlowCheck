import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { useAuthStore } from '../../stores/authStore'
import { OnboardingLayout, StepHeader } from './OnboardingLayout'
import { supabase } from '../../lib/supabase'
import { calculateISF } from '../../hooks/useISF'
import { parseAmount } from '../../utils/formatters'
import { Colors } from '../../constants/theme'
import type { RiskProfile, Profile } from '../../types/database'

interface ProfileCard {
  key: RiskProfile
  emoji: string
  title: string
  description: string
  traits: string[]
}

const PROFILES: ProfileCard[] = [
  {
    key: 'conservador',
    emoji: '🛡️',
    title: 'Conservador',
    description: 'Prefiero la seguridad. Prefiero ganar menos si eso significa dormir tranquilo.',
    traits: [
      'Ahorro en productos de bajo riesgo',
      'Evita endeudarse',
      'Prioriza el fondo de emergencia',
    ],
  },
  {
    key: 'moderado',
    emoji: '⚖️',
    title: 'Moderado',
    description: 'Busco un balance. Acepto algo de riesgo si hay posibilidad de mayor crecimiento.',
    traits: [
      'Mezcla ahorro e inversión',
      'Acepta deuda estratégica',
      'Metas a mediano plazo',
    ],
  },
  {
    key: 'arriesgado',
    emoji: '🚀',
    title: 'Arriesgado',
    description: 'Acepto más volatilidad. Me motivan las oportunidades de alto crecimiento.',
    traits: [
      'Invierte en opciones de mayor riesgo',
      'Usa apalancamiento con criterio',
      'Metas ambiciosas',
    ],
  },
]

export default function Step6RiskProfile() {
  const navigate = useNavigate()
  const { data, reset, setStep } = useOnboardingStore()
  const { session }              = useAuthStore()

  const [selected, setSelected] = useState<RiskProfile | null>(data.riskProfile)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleFinish = async () => {
    if (!selected || !session?.user) return
    setSaving(true)
    setError(null)

    const profileData: Partial<Profile> = {
      full_name:            data.fullName,
      university:           data.university  || null,
      career:               data.career      || null,
      stratum:              data.stratum,
      monthly_income:       parseAmount(data.monthlyIncome),
      income_sources:       data.incomeSources.length ? data.incomeSources : null,
      fixed_expenses:       parseAmount(data.fixedExpenses),
      variable_expenses:    parseAmount(data.variableExpenses),
      leisure_expenses:     parseAmount(data.leisureExpenses),
      total_debt:           parseAmount(data.totalDebt),
      monthly_debt_payment: parseAmount(data.monthlyDebtPayment),
      emergency_fund:       parseAmount(data.emergencyFund),
      savings_goal:         parseAmount(data.savingsGoal),
      savings_goal_months:  parseInt(data.savingsGoalMonths) || null,
      risk_profile:         selected,
      onboarding_completed: true,
    }

    // Calcular ISF con los datos recopilados
    const isfBreakdown = calculateISF(profileData as Profile)
    profileData.isf_score = isfBreakdown.total

    const { error: supaErr } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', session.user.id)

    setSaving(false)

    if (supaErr) {
      setError('No pudimos guardar tu perfil. Intenta de nuevo.')
      return
    }

    reset()
    navigate('/dashboard', { replace: true })
  }

  return (
    <OnboardingLayout
      currentStep={6}
      onNext={handleFinish}
      onBack={() => { setStep(5); navigate('/onboarding/5') }}
      nextLabel={saving ? 'Guardando...' : '¡Empecemos!'}
      canNext={!!selected && !saving}
      loadingNext={saving}
    >
      <StepHeader
        emoji="🧠"
        title="¿Cuál es tu estilo financiero?"
        subtitle="No hay una respuesta correcta. Elige la que más resuene contigo hoy."
      />

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            backgroundColor: Colors.redLight,
            borderRadius: 8,
            fontSize: 14,
            color: Colors.red,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PROFILES.map((profile) => {
          const isSelected = selected === profile.key
          return (
            <button
              key={profile.key}
              onClick={() => setSelected(profile.key)}
              style={{
                textAlign: 'left',
                backgroundColor: isSelected ? Colors.primaryLight : Colors.card,
                borderRadius: 16,
                padding: 16,
                border: `2px solid ${isSelected ? Colors.primary : Colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                fontFamily: 'inherit',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 28, marginRight: 12 }}>{profile.emoji}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: isSelected ? Colors.primary : Colors.textPrimary,
                    }}
                  >
                    {profile.title}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: Colors.primary,
                        color: Colors.white,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: '20px', margin: '0 0 8px' }}>
                {profile.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {profile.traits.map((trait) => (
                  <span key={trait} style={{ fontSize: 12, color: Colors.textMuted, lineHeight: '18px' }}>
                    • {trait}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </OnboardingLayout>
  )
}
