import React from 'react'
import { Colors } from '../constants/theme'
import type { BudgetSemaphore } from '../types/database'
import { formatCOP, formatPercent } from '../utils/formatters'

interface SemaphoreProps {
  data: BudgetSemaphore
}

const LIGHTS: Array<{ key: BudgetSemaphore['status']; color: string; label: string }> = [
  { key: 'rojo',     color: Colors.red,    label: 'Alerta'   },
  { key: 'amarillo', color: Colors.yellow, label: 'Atención' },
  { key: 'verde',    color: Colors.green,  label: 'Bien'     },
]

const STATUS_MESSAGES: Record<BudgetSemaphore['status'], string> = {
  verde:    '¡Vas bien este mes! Tu gasto está bajo control.',
  amarillo: 'Ya vas por más de la mitad del ingreso. Revisa los próximos gastos.',
  rojo:     'Superaste el límite recomendado. Pausa los gastos no esenciales.',
}

const BADGE_BG: Record<BudgetSemaphore['status'], string> = {
  verde:    Colors.greenLight,
  amarillo: Colors.yellowLight,
  rojo:     Colors.redLight,
}

export function Semaphore({ data }: SemaphoreProps) {
  const { status, percentage, committed, income } = data
  const savings = Math.max(0, income - committed)

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
      <p style={{ fontSize: 16, fontWeight: 600, color: Colors.textPrimary, margin: '0 0 16px' }}>
        Semáforo de Presupuesto
      </p>

      {/* Traffic light */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          backgroundColor: '#1C1C1E',
          borderRadius: 24,
          padding: '8px 12px',
          marginBottom: 16,
        }}
      >
        {LIGHTS.map((light) => {
          const isActive = light.key === status
          return (
            <div
              key={light.key}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: light.color,
                  opacity: isActive ? 1 : 0.2,
                  transition: 'opacity 0.3s',
                }}
              />
              {isActive && (
                <span style={{ fontSize: 12, fontWeight: 700, color: light.color }}>
                  {light.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 28, fontWeight: 800, color: Colors.textPrimary, margin: '0 0 4px' }}>
        {formatPercent(percentage)}
      </p>
      <p style={{ fontSize: 14, color: Colors.textSecondary, margin: '0 0 16px' }}>
        del ingreso gastado este mes
      </p>

      {/* Breakdown */}
      <div style={{ display: 'flex', width: '100%', marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 2 }}>Gastado</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: Colors.red }}>{formatCOP(committed)}</span>
        </div>
        <div style={{ width: 1, backgroundColor: Colors.border }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 2 }}>Disponible</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: Colors.green }}>{formatCOP(savings)}</span>
        </div>
      </div>

      {/* Message */}
      <div
        style={{
          width: '100%',
          borderRadius: 12,
          padding: '8px 12px',
          backgroundColor: BADGE_BG[status],
        }}
      >
        <p style={{ fontSize: 12, color: Colors.textPrimary, textAlign: 'center', lineHeight: '18px', margin: 0 }}>
          {STATUS_MESSAGES[status]}
        </p>
      </div>
    </div>
  )
}
