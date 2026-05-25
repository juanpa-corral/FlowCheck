import React from 'react'
import { Colors, ISF_THRESHOLDS } from '../constants/theme'
import type { ISFBreakdown } from '../types/database'
import { getISFLabel, getISFMessage } from '../hooks/useISF'

interface ISFCardProps {
  breakdown: ISFBreakdown
}

function scoreColor(total: number): string {
  if (total >= ISF_THRESHOLDS.medium) return Colors.green
  if (total >= ISF_THRESHOLDS.low) return Colors.yellow
  return Colors.red
}

interface ScoreRowProps {
  label: string
  score: number
  max: number
}

function ScoreRow({ label, score, max }: ScoreRowProps) {
  const pct = (score / max) * 100
  const color = scoreColor(pct)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          color: Colors.textSecondary,
          width: 108,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
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
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 9999,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: Colors.textMuted, width: 32, textAlign: 'right' }}>
        {score}/{max}
      </span>
    </div>
  )
}

export function ISFCard({ breakdown }: ISFCardProps) {
  const { total, savingsScore, leisureScore, emergencyScore, debtScore } = breakdown
  const color = scoreColor(total)

  return (
    <div
      style={{
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <p style={{ fontSize: 16, fontWeight: 600, color: Colors.textPrimary, marginBottom: 16, margin: '0 0 16px' }}>
        Índice de Salud Financiera
      </p>

      {/* Score badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          width: 110,
          height: 110,
          borderRadius: '50%',
          border: `3px solid ${color}`,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>
          {Math.round(total)}
        </span>
        <span style={{ fontSize: 16, fontWeight: 600, color: Colors.textMuted, marginBottom: 6 }}>
          /100
        </span>
      </div>

      <p style={{ fontSize: 18, fontWeight: 700, color, margin: '0 0 4px' }}>
        {getISFLabel(total)}
      </p>
      <p
        style={{
          fontSize: 14,
          color: Colors.textSecondary,
          textAlign: 'center',
          lineHeight: '20px',
          margin: '0 0 16px',
          padding: '0 8px',
        }}
      >
        {getISFMessage(total)}
      </p>

      {/* Breakdown */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ScoreRow label="Ahorro" score={savingsScore} max={30} />
        <ScoreRow label="Ocio controlado" score={leisureScore} max={20} />
        <ScoreRow label="Fondo emergencia" score={emergencyScore} max={30} />
        <ScoreRow label="Carga de deuda" score={debtScore} max={20} />
      </div>
    </div>
  )
}
