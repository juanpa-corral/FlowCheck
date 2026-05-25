import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { OnboardingLayout, StepHeader, Field, TextInput } from './OnboardingLayout'
import { Colors } from '../../constants/theme'

const STRATA = [1, 2, 3, 4, 5, 6]

export default function Step1Identity() {
  const navigate = useNavigate()
  const { data, updateData, setStep } = useOnboardingStore()

  const [fullName, setFullName]     = useState(data.fullName)
  const [university, setUniversity] = useState(data.university)
  const [career, setCareer]         = useState(data.career)
  const [stratum, setStratum]       = useState<number | null>(data.stratum)

  const canContinue = fullName.trim().length > 1

  const handleNext = () => {
    updateData({ fullName: fullName.trim(), university, career, stratum })
    setStep(2)
    navigate('/onboarding/2')
  }

  return (
    <OnboardingLayout
      currentStep={1}
      onNext={handleNext}
      canNext={canContinue}
    >
      <StepHeader
        emoji="👤"
        title="¡Hola! Cuéntanos sobre ti"
        subtitle="Necesitamos conocerte para darte consejos personalizados."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="¿Cómo te llamas? *">
          <TextInput
            value={fullName}
            onChange={setFullName}
            placeholder="Tu nombre completo"
          />
        </Field>

        <Field label="¿En qué universidad estudias?">
          <TextInput
            value={university}
            onChange={setUniversity}
            placeholder="Ej: Universidad Nacional"
          />
        </Field>

        <Field label="¿Qué carrera cursas?">
          <TextInput
            value={career}
            onChange={setCareer}
            placeholder="Ej: Ingeniería de Sistemas"
          />
        </Field>

        <Field label="¿Cuál es tu estrato socioeconómico?">
          <div style={{ display: 'flex', gap: 8 }}>
            {STRATA.map((s) => {
              const isActive = stratum === s
              return (
                <button
                  key={s}
                  onClick={() => setStratum(s === stratum ? null : s)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 8,
                    border: `1.5px solid ${isActive ? Colors.primary : Colors.border}`,
                    backgroundColor: isActive ? Colors.primaryLight : Colors.card,
                    color: isActive ? Colors.primary : Colors.textSecondary,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </OnboardingLayout>
  )
}
