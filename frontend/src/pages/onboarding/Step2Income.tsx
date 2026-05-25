import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { OnboardingLayout, StepHeader, Field, CurrencyInput } from './OnboardingLayout'
import { Colors } from '../../constants/theme'
import { INCOME_SOURCE_LABELS } from '../../utils/formatters'
import type { IncomeSource } from '../../types/database'

const SOURCES: IncomeSource[] = [
  'beca',
  'trabajo_parcial',
  'apoyo_familiar',
  'freelance',
  'otro',
]

export default function Step2Income() {
  const navigate = useNavigate()
  const { data, updateData, toggleIncomeSource, setStep } = useOnboardingStore()
  const [income, setIncome] = useState(data.monthlyIncome)

  const canContinue = parseFloat(income) > 0

  const handleNext = () => {
    updateData({ monthlyIncome: income })
    setStep(3)
    navigate('/onboarding/3')
  }

  return (
    <OnboardingLayout
      currentStep={2}
      onNext={handleNext}
      onBack={() => { setStep(1); navigate('/onboarding/1') }}
      canNext={canContinue}
    >
      <StepHeader
        emoji="💰"
        title="¿Cuánto entra cada mes?"
        subtitle="Incluye todo: beca, mesada, trabajo, etc. Sin juicios."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field
          label="Ingreso mensual total (COP) *"
          hint="Si varía mes a mes, usa tu promedio de los últimos 3 meses."
        >
          <CurrencyInput value={income} onChange={setIncome} large />
        </Field>

        <Field label="¿De dónde viene? (selecciona todo lo que aplique)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SOURCES.map((source) => {
              const isActive = data.incomeSources.includes(source)
              return (
                <button
                  key={source}
                  onClick={() => toggleIncomeSource(source)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: `1.5px solid ${isActive ? Colors.primary : Colors.border}`,
                    backgroundColor: isActive ? Colors.primaryLight : Colors.card,
                    color: isActive ? Colors.primary : Colors.textSecondary,
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {INCOME_SOURCE_LABELS[source]}
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </OnboardingLayout>
  )
}
