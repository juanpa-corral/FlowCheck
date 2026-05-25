import React from 'react'
import { Colors } from '../../constants/theme'
import { ProgressBar } from '../../components/ProgressBar'
import { Button } from '../../components/Button'

interface OnboardingLayoutProps {
  currentStep: number
  children: React.ReactNode
  onNext: () => void
  onBack?: () => void
  nextLabel?: string
  canNext?: boolean
  loadingNext?: boolean
}

export function OnboardingLayout({
  currentStep,
  children,
  onNext,
  onBack,
  nextLabel = 'Continuar',
  canNext = true,
  loadingNext = false,
}: OnboardingLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: Colors.background,
      }}
    >
      {/* Progress bar header */}
      <div style={{ padding: '16px 24px 0' }}>
        <ProgressBar currentStep={currentStep} />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 24px',
        }}
        className="scrollbar-hide"
      >
        {children}
      </div>

      {/* Footer navigation */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: Colors.background,
          borderTop: `1px solid ${Colors.border}`,
          display: 'flex',
          gap: 8,
        }}
      >
        {onBack && (
          <Button
            label="Atrás"
            variant="ghost"
            onClick={onBack}
            className="flex-1"
          />
        )}
        <Button
          label={nextLabel}
          onClick={onNext}
          disabled={!canNext}
          loading={loadingNext}
          className={onBack ? 'flex-[2]' : 'w-full'}
        />
      </div>
    </div>
  )
}

// Componentes helper reutilizables dentro del onboarding

interface StepHeaderProps {
  emoji: string
  title: string
  subtitle: string
}

export function StepHeader({ emoji, title, subtitle }: StepHeaderProps) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: Colors.textPrimary,
          margin: '0 0 8px',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: Colors.textSecondary,
          lineHeight: '20px',
          margin: 0,
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}

interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>
        {label}
      </label>
      {hint && (
        <span style={{ fontSize: 12, color: Colors.textMuted }}>{hint}</span>
      )}
      {children}
    </div>
  )
}

interface TextInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}

export function TextInput({ value, onChange, placeholder, type = 'text', inputMode }: TextInputProps) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        height: 48,
        border: `1.5px solid ${Colors.border}`,
        borderRadius: 8,
        padding: '0 16px',
        fontSize: 16,
        color: Colors.textPrimary,
        backgroundColor: Colors.card,
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        fontFamily: 'inherit',
      }}
    />
  )
}

interface CurrencyInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  large?: boolean
}

export function CurrencyInput({ value, onChange, placeholder = '0', large = false }: CurrencyInputProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        border: `1.5px solid ${Colors.border}`,
        borderRadius: 8,
        backgroundColor: Colors.card,
        padding: '0 16px',
        height: large ? 56 : 52,
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: large ? 22 : 18,
          fontWeight: 700,
          color: Colors.primary,
        }}
      >
        $
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        placeholder={placeholder}
        style={{
          flex: 1,
          fontSize: large ? 22 : 18,
          fontWeight: 700,
          color: Colors.textPrimary,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
