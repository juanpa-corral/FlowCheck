import React from 'react'
import { Colors } from '../constants/theme'
import { getLevelInfo } from '../hooks/usePoints'

interface PointsBadgeProps {
  points: number
  compact?: boolean   // true → solo muestra puntos sin barra de nivel
}

export function PointsBadge({ points, compact = false }: PointsBadgeProps) {
  const { level, name, emoji, progress, nextLevelPts } = getLevelInfo(points)

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: Colors.primaryLight,
          borderRadius: 9999,
          padding: '4px 12px',
        }}
      >
        <span style={{ fontSize: 14 }}>⭐</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: Colors.primary }}>
          {points.toLocaleString('es-CO')} pts
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Cabecera: puntos + nivel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: Colors.textMuted, margin: '0 0 2px' }}>Mis puntos FlowCheck</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: Colors.primary, margin: 0 }}>
            ⭐ {points.toLocaleString('es-CO')}
          </p>
        </div>
        <div
          style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 12,
            padding: '6px 12px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 18, margin: '0 0 2px' }}>{emoji}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: Colors.primary, margin: 0 }}>
            Niv. {level}
          </p>
          <p style={{ fontSize: 10, color: Colors.textSecondary, margin: 0, whiteSpace: 'nowrap' }}>
            {name}
          </p>
        </div>
      </div>

      {/* Barra de progreso al siguiente nivel */}
      {level < 5 && (
        <>
          <div
            style={{
              height: 6,
              backgroundColor: Colors.border,
              borderRadius: 9999,
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: Colors.primary,
                borderRadius: 9999,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: Colors.textMuted, margin: 0, textAlign: 'right' }}>
            {(nextLevelPts - points).toLocaleString('es-CO')} pts para nivel {level + 1}
          </p>
        </>
      )}
    </div>
  )
}
