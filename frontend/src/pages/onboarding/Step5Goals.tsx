import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { OnboardingLayout, StepHeader, Field, CurrencyInput, TextInput } from './OnboardingLayout'
import { Colors } from '../../constants/theme'
import { parseAmount } from '../../utils/formatters'

export default function Step5Goals() {
  const navigate = useNavigate()
  const { data, updateData, setStep } = useOnboardingStore()

  const [savingsGoal, setSavingsGoal] = useState(data.savingsGoal)
  const [months,      setMonths]      = useState(data.savingsGoalMonths)

  const goal   = parseAmount(savingsGoal)
  const income = parseAmount(data.monthlyIncome)
  const totalExpenses =
    parseAmount(data.fixedExpenses) +
    parseAmount(data.variableExpenses) +
    parseAmount(data.leisureExpenses) +
    parseAmount(data.monthlyDebtPayment)
  const monthlySavingsCapacity = Math.max(0, income - totalExpenses)
  const monthsNeeded =
    goal > 0 && monthlySavingsCapacity > 0
      ? Math.ceil(goal / monthlySavingsCapacity)
      : null

  const handleNext = () => {
    updateData({
      savingsGoal:       savingsGoal || '0',
      savingsGoalMonths: months      || '0',
    })
    setStep(6)
    navigate('/onboarding/6')
  }

  return (
    <OnboardingLayout
      currentStep={5}
      onNext={handleNext}
      onBack={() => { setStep(4); navigate('/onboarding/4') }}
    >
      <StepHeader
        emoji="🎯"
        title="¿Qué quieres lograr?"
        subtitle="Tener una meta clara hace que ahorrar sea más fácil y motivador."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field
          label="¿Cuánto quieres ahorrar? (COP)"
          hint="Puede ser para un viaje, tu primer apartamento, un fondo de emergencia…"
        >
          <CurrencyInput value={savingsGoal} onChange={setSavingsGoal} />
        </Field>

        {/* Proyección personalizada */}
        {monthlySavingsCapacity > 0 && goal > 0 && monthsNeeded !== null && (
          <div
            style={{
              backgroundColor: Colors.primaryLight,
              borderRadius: 12,
              padding: 16,
              borderLeft: `3px solid ${Colors.primary}`,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: Colors.primary, margin: '0 0 6px' }}>
              Proyección personalizada
            </p>
            <p style={{ fontSize: 14, color: Colors.textPrimary, lineHeight: '20px', margin: 0 }}>
              Con tu capacidad de ahorro actual (
              <strong style={{ color: Colors.primary }}>
                ${monthlySavingsCapacity.toLocaleString('es-CO')} / mes
              </strong>
              ), alcanzarás tu meta en aproximadamente{' '}
              <strong style={{ color: Colors.primary }}>
                {monthsNeeded} {monthsNeeded === 1 ? 'mes' : 'meses'}
              </strong>
              .
            </p>
          </div>
        )}

        <Field
          label="¿En cuántos meses quieres lograrlo?"
          hint="Opcional. Si no sabes, déjalo en blanco."
        >
          <TextInput
            value={months}
            onChange={(v) => setMonths(v.replace(/[^0-9]/g, ''))}
            placeholder="Ej: 12"
            inputMode="numeric"
          />
        </Field>
      </div>
    </OnboardingLayout>
  )
}
