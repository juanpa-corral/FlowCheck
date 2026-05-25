import React from 'react'
import { Colors, Radius } from '../constants/theme'

// ── Tipos ─────────────────────────────────────────────────────

interface GhostExpensesWidgetProps {
  /** Suma de gastos de tipo suscripcion + fijo + servicios este mes */
  monthlyGhostTotal: number
  /** Callback para navegar a analítica */
  onSeeDetail?: () => void
}

// ── Formato ───────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

// ── Ejemplos de gastos fantasma ───────────────────────────────

const GHOST_EXAMPLES = [
  { emoji: '📺', label: 'Streaming' },
  { emoji: '🎵', label: 'Música' },
  { emoji: '☁️', label: 'Cloud' },
  { emoji: '🏠', label: 'Fijos' },
]

// ── Componente ────────────────────────────────────────────────

/**
 * Widget "Radar de Gastos Fantasma".
 * Toma el total mensual de suscripciones/fijos reales registrados
 * y proyecta el costo anual para crear conciencia financiera.
 */
export function GhostExpensesWidget({ monthlyGhostTotal, onSeeDetail }: GhostExpensesWidgetProps) {
  const annual = monthlyGhostTotal * 12

  if (monthlyGhostTotal === 0) {
    return (
      <div
        style={{
          backgroundColor: Colors.card,
          borderRadius: Radius.card,
          padding: 16,
          border: `1.5px dashed ${Colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>👻</span>
          <p style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
            Gastos Fantasma
          </p>
        </div>
        <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0 }}>
          Sin registros de suscripciones o gastos fijos este mes.
          Registra tus pagos recurrentes para ver la proyección anual.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: `linear-gradient(135deg, #1A2E2A 0%, #0F1F1C 100%)`,
        borderRadius: Radius.card,
        padding: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 18 }}>👻</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Gastos Fantasma
            </p>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Suscripciones y gastos fijos este mes
          </p>
        </div>

        {onSeeDetail && (
          <button
            onClick={onSeeDetail}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Ver detalle →
          </button>
        )}
      </div>

      {/* Cifras */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>Este mes</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {fmt(monthlyGhostTotal)}
          </p>
        </div>
        <div
          style={{
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            margin: '0 4px',
          }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>
            Proyección anual
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: Colors.yellow, margin: 0 }}>
            {fmt(annual)}
          </p>
        </div>
      </div>

      {/* Insight */}
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 12,
          borderLeft: `3px solid ${Colors.yellow}`,
        }}
      >
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '17px' }}>
          💡 Esos {fmt(monthlyGhostTotal)} mensuales equivalen a{' '}
          <strong style={{ color: Colors.yellow }}>{fmt(annual)} al año</strong>.
          ¿Cuántos son realmente indispensables?
        </p>
      </div>

      {/* Íconos de categorías */}
      <div style={{ display: 'flex', gap: 8 }}>
        {GHOST_EXAMPLES.map(({ emoji, label }) => (
          <div
            key={label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {emoji}
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
