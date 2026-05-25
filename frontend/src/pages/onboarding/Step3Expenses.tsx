import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { OnboardingLayout, StepHeader, Field, CurrencyInput } from './OnboardingLayout'

export default function Step3Expenses() {
  const navigate  = useNavigate()
  const { data, updateData, setStep } = useOnboardingStore()

  const [fixed,    setFixed]    = useState(data.fixedExpenses)
  const [variable, setVariable] = useState(data.variableExpenses)
  const [leisure,  setLeisure]  = useState(data.leisureExpenses)

  // Siempre se puede continuar (valores 0 son válidos)
  const canContinue = true

  const handleNext = () => {
    updateData({
      fixedExpenses:    fixed    || '0',
      variableExpenses: variable || '0',
      leisureExpenses:  leisure  || '0',
    })
    setStep(4)
    navigate('/onboarding/4')
  }

  return (
    <OnboardingLayout
      currentStep={3}
      onNext={handleNext}
      onBack={() => { setStep(2); navigate('/onboarding/2') }}
      canNext={canContinue}
    >
      <StepHeader
        emoji="📊"
        title="¿En qué gastas tu dinero?"
        subtitle="Estima tus gastos mensuales. Si no estás seguro, aproxima."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field
          label="Gastos fijos (COP)"
          hint="Arriendo, transporte mensual, suscripciones"
        >
          <CurrencyInput value={fixed} onChange={setFixed} />
        </Field>

        <Field
          label="Gastos variables (COP)"
          hint="Alimentación, mercado, salud, aseo personal"
        >
          <CurrencyInput value={variable} onChange={setVariable} />
        </Field>

        <Field
          label="Ocio y entretenimiento (COP)"
          hint="Salidas, streaming, ropa no esencial"
        >
          <CurrencyInput value={leisure} onChange={setLeisure} />
        </Field>
      </div>
    </OnboardingLayout>
  )
}
