import React, { useState, useEffect } from 'react'
import { Colors } from '../constants/theme'
import type { Profile } from '../types/database'
import { formatCOP, formatPercent } from '../utils/formatters'

interface NudgeModalProps {
  amount: number
  category: string
  profile: Profile
  onConfirmDirect: () => void    // "Registrar de todas formas"
  onPauseAndConfirm: () => void  // Pausó → luego confirmó (+25 pts)
  onCancel: () => void           // Canceló el gasto
}

type Phase = 'nudge' | 'breathing' | 'reflect'

const CATEGORY_LABELS: Record<string, string> = {
  alimentacion: 'Alimentación', transporte: 'Transporte',
  ocio: 'Ocio', educacion: 'Educación',
  salud: 'Salud', servicios: 'Servicios', otros: 'Otros',
}

function getSemaphoreColor(pct: number) {
  if (pct <= 50)  return Colors.green
  if (pct <= 75)  return Colors.yellow
  return Colors.red
}

function getSemaphoreLabel(pct: number) {
  if (pct <= 50)  return { status: 'verde',    emoji: '🟢', text: 'Presupuesto saludable' }
  if (pct <= 75)  return { status: 'amarillo', emoji: '🟡', text: 'Presupuesto en atención' }
  return              { status: 'rojo',     emoji: '🔴', text: 'Presupuesto en alerta' }
}

function getNudgeMessage(pct: number, category: string, isLeisureWarning: boolean): string {
  if (isLeisureWarning)
    return '🎮 Ya tienes bastante destinado a ocio y tu fondo de emergencia está bajo. ¿Este gasto puede esperar?'
  if (pct > 75)
    return '⚠️ Este gasto llevará tu presupuesto a zona roja. ¿Ya tienes cubiertos los básicos del mes?'
  if (pct > 50)
    return '💡 Superas la mitad de tu ingreso comprometido. ¿Este gasto es prioritario hoy?'
  if (category === 'ocio')
    return '🎮 El ocio planificado es sano; el impulsivo puede desviar tus metas. ¿Está en tu presupuesto?'
  return '✅ Este gasto está dentro de tu presupuesto. ¡Solo asegúrate de que sea intencional!'
}

export function NudgeModal({
  amount,
  category,
  profile,
  onConfirmDirect,
  onPauseAndConfirm,
  onCancel,
}: NudgeModalProps) {
  const [phase, setPhase]   = useState<Phase>('nudge')
  const [countdown, setCountdown] = useState(3)

  // Cálculos de impacto presupuestal
  const income      = profile.monthly_income
  const committed   = profile.fixed_expenses + profile.variable_expenses +
                      profile.leisure_expenses + profile.monthly_debt_payment
  const currentPct  = income > 0 ? (committed / income) * 100 : 0
  const newPct      = income > 0 ? ((committed + amount) / income) * 100 : 0
  const amountPct   = income > 0 ? (amount / income) * 100 : 0

  const isLeisureWarning =
    category === 'ocio' &&
    income > 0 &&
    (profile.leisure_expenses / income) > 0.30 &&
    profile.emergency_fund < (profile.fixed_expenses + profile.variable_expenses)

  const afterStatus  = getSemaphoreLabel(newPct)
  const afterColor   = getSemaphoreColor(newPct)
  const nudgeMessage = getNudgeMessage(newPct, category, isLeisureWarning)

  // Countdown de la fase de respiración
  useEffect(() => {
    if (phase !== 'breathing') return
    if (countdown <= 0) { setPhase('reflect'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  const handlePause = () => {
    setPhase('breathing')
    setCountdown(3)
  }

  // ── Overlay base ──────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          backgroundColor: Colors.card,
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s ease',
        }}
      >

        {/* ── FASE 1: Nudge principal ─────────────────────── */}
        {phase === 'nudge' && (
          <>
            {/* Drag handle */}
            <div style={{ width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, margin: '0 auto 16px' }} />

            <p style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 4px' }}>
              🧠 Antes de confirmar…
            </p>
            <p style={{ fontSize: 13, color: Colors.textSecondary, margin: '0 0 20px' }}>
              Registras <strong>{formatCOP(amount)}</strong> en <strong>{CATEGORY_LABELS[category] ?? category}</strong>
            </p>

            {/* Impacto del gasto */}
            <div
              style={{
                backgroundColor: `${afterColor}15`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                border: `1px solid ${afterColor}40`,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: afterColor, margin: '0 0 12px' }}>
                {afterStatus.emoji} {afterStatus.text} · consumirá {formatPercent(amountPct)} de tu ingreso
              </p>

              {/* Barra: estado actual */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: Colors.textMuted }}>Ahora</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: getSemaphoreColor(currentPct) }}>
                    {formatPercent(currentPct)}
                  </span>
                </div>
                <div style={{ height: 8, backgroundColor: Colors.border, borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, currentPct)}%`,
                    backgroundColor: getSemaphoreColor(currentPct), borderRadius: 9999,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Barra: estado después */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: Colors.textMuted }}>Después</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: afterColor }}>
                    {formatPercent(newPct)}
                  </span>
                </div>
                <div style={{ height: 8, backgroundColor: Colors.border, borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, newPct)}%`,
                    backgroundColor: afterColor, borderRadius: 9999,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* Mensaje del nudge */}
            <div
              style={{
                backgroundColor: Colors.primaryLight,
                borderRadius: 10,
                padding: 12,
                marginBottom: 20,
                borderLeft: `3px solid ${Colors.primary}`,
              }}
            >
              <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px' }}>
                {nudgeMessage}
              </p>
            </div>

            {/* Penalización de ocio */}
            {isLeisureWarning && (
              <div
                style={{
                  backgroundColor: Colors.redLight,
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 16,
                  border: `1px solid ${Colors.redA30}`,
                }}
              >
                <p style={{ fontSize: 12, color: Colors.red, margin: 0, fontWeight: 600 }}>
                  ⚠️ Penalización activa: -15 pts por ocio excesivo sin fondo de emergencia
                </p>
              </div>
            )}

            {/* Acciones */}
            <button
              onClick={handlePause}
              style={{
                width: '100%', height: 52,
                backgroundColor: Colors.primary, color: Colors.white,
                borderRadius: 12, border: 'none',
                fontSize: 15, fontWeight: 700,
                cursor: 'pointer', marginBottom: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              🧘 Pausar y reflexionar
              <span
                style={{
                  backgroundColor: Colors.green, color: '#fff',
                  fontSize: 11, fontWeight: 800,
                  borderRadius: 9999, padding: '2px 7px',
                }}
              >
                +25 pts
              </span>
            </button>

            <button
              onClick={onConfirmDirect}
              style={{
                width: '100%', height: 48,
                backgroundColor: 'transparent', color: Colors.textSecondary,
                borderRadius: 12, border: `1.5px solid ${Colors.border}`,
                fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Registrar de todas formas
            </button>

            <button
              onClick={onCancel}
              style={{
                width: '100%', height: 40, marginTop: 6,
                backgroundColor: 'transparent', color: Colors.textMuted,
                border: 'none', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
          </>
        )}

        {/* ── FASE 2: Respiración (3 segundos) ────────────── */}
        {phase === 'breathing' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🌬️</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 8px' }}>
              Toma un momento…
            </p>
            <p style={{ fontSize: 14, color: Colors.textSecondary, margin: '0 0 24px', lineHeight: '20px' }}>
              Respirar antes de una decisión financiera <br />es un superpoder. ¡Lo estás haciendo muy bien!
            </p>
            <div
              style={{
                width: 64, height: 64,
                borderRadius: '50%',
                backgroundColor: Colors.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
                fontSize: 28, fontWeight: 800, color: Colors.primary,
                border: `3px solid ${Colors.primary}`,
              }}
            >
              {countdown}
            </div>
          </div>
        )}

        {/* ── FASE 3: Reflexión — decidir ─────────────────── */}
        {phase === 'reflect' && (
          <>
            <div style={{ width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, margin: '0 auto 16px' }} />

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>⭐</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: Colors.green, margin: '0 0 4px' }}>
                ¡+25 puntos ganados!
              </p>
              <p style={{ fontSize: 13, color: Colors.textSecondary, margin: 0 }}>
                Reflexionaste antes de gastar. Eso es salud financiera real.
              </p>
            </div>

            <div
              style={{
                backgroundColor: Colors.greenLight,
                borderRadius: 10, padding: 12, marginBottom: 20,
                border: `1px solid ${Colors.greenA40}`,
              }}
            >
              <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px' }}>
                Después de reflexionar, ¿qué decides con los <strong>{formatCOP(amount)}</strong> en{' '}
                <strong>{CATEGORY_LABELS[category] ?? category}</strong>?
              </p>
            </div>

            <button
              onClick={onPauseAndConfirm}
              style={{
                width: '100%', height: 52,
                backgroundColor: Colors.primary, color: Colors.white,
                borderRadius: 12, border: 'none',
                fontSize: 15, fontWeight: 700,
                cursor: 'pointer', marginBottom: 10,
                fontFamily: 'inherit',
              }}
            >
              Sí, registrar el gasto
            </button>

            <button
              onClick={onCancel}
              style={{
                width: '100%', height: 48,
                backgroundColor: 'transparent', color: Colors.red,
                borderRadius: 12, border: `1.5px solid ${Colors.redA30}`,
                fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🚫 Cancelar el gasto (decisión inteligente)
            </button>
          </>
        )}
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }       to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
