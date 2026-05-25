import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { OnboardingLayout, StepHeader, Field, CurrencyInput } from './OnboardingLayout'
import { Colors } from '../../constants/theme'
import { parseAmount } from '../../utils/formatters'

export default function Step4Debt() {
  const navigate = useNavigate()
  const { data, updateData, setStep } = useOnboardingStore()

  const [totalDebt,     setTotalDebt]     = useState(data.totalDebt)
  const [monthlyPay,    setMonthlyPay]    = useState(data.monthlyDebtPayment)
  const [emergencyFund, setEmergencyFund] = useState(data.emergencyFund)

  const income  = parseAmount(data.monthlyIncome)
  const payment = parseAmount(monthlyPay)
  const debtRatio = income > 0 ? (payment / income) * 100 : 0

  const ratioColor =
    debtRatio < 20 ? Colors.green :
    debtRatio < 40 ? Colors.yellow :
    Colors.red

  const handleNext = () => {
    updateData({
      totalDebt:          totalDebt     || '0',
      monthlyDebtPayment: monthlyPay    || '0',
      emergencyFund:      emergencyFund || '0',
    })
    setStep(5)
    navigate('/onboarding/5')
  }

  return (
    <OnboardingLayout
      currentStep={4}
      onNext={handleNext}
      onBack={() => { setStep(3); navigate('/onboarding/3') }}
    >
      <StepHeader
        emoji="💳"
        title="¿Tienes alguna deuda?"
        subtitle="Sin juicios. Esta info nos ayuda a protegerte de comprometerte de más."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field
          label="Deuda total acumulada (COP)"
          hint="Créditos, tarjetas, préstamos. Pon 0 si no tienes."
        >
          <CurrencyInput value={totalDebt} onChange={setTotalDebt} />
        </Field>

        <Field
          label="Pago mensual de deudas (COP)"
          hint="Cuota mensual total que destinas a pagar deudas."
        >
          <CurrencyInput value={monthlyPay} onChange={setMonthlyPay} />
          {income > 0 && payment > 0 && (
            <div
              style={{
                borderRadius: 8,
                padding: '8px 12px',
                backgroundColor: `${ratioColor}20`,
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: ratioColor }}>
                Ratio de deuda: {debtRatio.toFixed(1)}% del ingreso
                {debtRatio < 20 ? ' ✓ Saludable' : debtRatio < 40 ? ' ⚠ Moderado' : ' ✗ Alto'}
              </span>
            </div>
          )}
        </Field>

        <Field
          label="Fondo de emergencia actual (COP)"
          hint="Dinero ahorrado para imprevistos. Puede ser $0."
        >
          <CurrencyInput value={emergencyFund} onChange={setEmergencyFund} />
        </Field>
      </div>
    </OnboardingLayout>
  )
}
