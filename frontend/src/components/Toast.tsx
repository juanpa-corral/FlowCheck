import React, { useEffect, useRef, useState } from 'react'
import { Colors } from '../constants/theme'

// ── Tipos ─────────────────────────────────────────────────────

type ToastType = 'warning' | 'success' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number          // ms; default 4000
  onDismiss?: () => void
}

// ── Estilos por tipo ──────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { bg: string; color: string; emoji: string }> = {
  warning: { bg: Colors.yellowLight, color: Colors.yellow,  emoji: '⚠️' },
  success: { bg: Colors.greenLight,  color: Colors.primary, emoji: '✅' },
  info:    { bg: Colors.card,        color: Colors.textPrimary, emoji: 'ℹ️' },
}

// ── Componente ────────────────────────────────────────────────

/**
 * Toast / Snackbar que aparece desde el fondo de la pantalla.
 * Se auto-descarta al expirar `duration` ms.
 * Llama `onDismiss` cuando desaparece para que el padre limpie el estado.
 */
export function Toast({ message, type = 'warning', duration = 4000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Slide-in al montar
  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true))
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss?.(), 300) // esperar slide-out
    }, duration)

    return () => {
      cancelAnimationFrame(enter)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [duration, onDismiss])

  const cfg = TOAST_CONFIG[type]

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 300) }}
      style={{
        position: 'fixed',
        bottom: visible ? 24 : -120,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 440,
        width: 'calc(100% - 32px)',
        backgroundColor: cfg.bg,
        border: `1.5px solid ${cfg.color}40`,
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        zIndex: 9999,
        cursor: 'pointer',
        transition: 'bottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: '22px' }}>{cfg.emoji}</span>
      <p style={{
        fontSize: 13,
        lineHeight: '19px',
        color: Colors.textPrimary,
        margin: 0,
        fontWeight: 500,
      }}>
        {message}
      </p>
    </div>
  )
}
