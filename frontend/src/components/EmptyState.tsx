import React from 'react'
import { Colors, Radius, Font } from '../constants/theme'

interface EmptyStateProps {
  emoji?: string
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ emoji = '🔍', title, subtitle, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: 8,
      }}
    >
      <p style={{ fontSize: 48, margin: '0 0 8px', lineHeight: 1 }}>{emoji}</p>
      <p
        style={{
          fontSize: 16,
          fontFamily: Font.family,
          fontWeight: Font.weightBold,
          color: Colors.textPrimary,
          margin: 0,
        }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          style={{
            fontSize: 14,
            fontFamily: Font.family,
            color: Colors.textMuted,
            margin: 0,
            lineHeight: '20px',
            maxWidth: 280,
          }}
        >
          {subtitle}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 12,
            height: 48,
            paddingLeft: 24,
            paddingRight: 24,
            backgroundColor: Colors.primary,
            color: Colors.white,
            borderRadius: Radius.button,
            border: 'none',
            fontSize: 14,
            fontFamily: Font.family,
            fontWeight: Font.weightBold,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
