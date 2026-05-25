import React from 'react'
import { Colors } from '../constants/theme'
import { TOTAL_STEPS } from '../stores/onboardingStore'

interface ProgressBarProps {
  currentStep: number
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = (currentStep / TOTAL_STEPS) * 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          backgroundColor: Colors.border,
          borderRadius: 9999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: Colors.primary,
            borderRadius: 9999,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          color: Colors.textMuted,
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {currentStep} de {TOTAL_STEPS}
      </span>
    </div>
  )
}
