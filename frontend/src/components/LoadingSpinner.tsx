import React from 'react'
import { Colors, Font } from '../constants/theme'

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ message = 'Cargando…', fullScreen = false }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        ...(fullScreen
          ? { minHeight: '100vh', backgroundColor: Colors.background }
          : { padding: '48px 24px' }),
      }}
    >
      {/* Spinner animado */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `3px solid ${Colors.primaryLight}`,
          borderTopColor: Colors.primary,
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p
        style={{
          fontSize: 14,
          fontFamily: Font.family,
          fontWeight: Font.weightMedium,
          color: Colors.textMuted,
          margin: 0,
        }}
      >
        {message}
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
