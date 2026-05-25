import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Colors, Radius, Font } from '../constants/theme'

// ── Catálogo de retos ─────────────────────────────────────────

interface Challenge {
  id:      string
  emoji:   string
  title:   string
  desc:    string
  points:  number
  category: string
}

const ALL_CHALLENGES: Challenge[] = [
  { id: 'no_delivery',    emoji: '🍕', title: 'Semana sin domicilios',        desc: 'Evita pedir delivery toda la semana',           points: 100, category: 'Ocio'       },
  { id: 'save_10pct',     emoji: '💰', title: 'Ahorra el 10% esta quincena', desc: 'Separa el 10% de tu próximo ingreso al recibirlo',points: 100, category: 'Ahorro'    },
  { id: 'meal_prep',      emoji: '🥗', title: 'Cocina 3 almuerzos',           desc: 'Prepara tu propio almuerzo 3 días seguidos',     points: 100, category: 'Hábito'    },
  { id: 'no_impulse',     emoji: '🛍️', title: 'Cero compras impulsivas',     desc: 'Solo compras planeadas durante 7 días',          points: 100, category: 'Conducta'  },
  { id: 'track_all',      emoji: '📊', title: 'Registra todos tus gastos',    desc: 'Anota cada gasto en FlowCheck por 5 días',       points: 100, category: 'Registro'  },
  { id: 'no_cafe',        emoji: '☕', title: 'Café en casa esta semana',      desc: 'Prepara tu café en casa todos los días',         points: 100, category: 'Hábito'    },
  { id: 'emergency_add',  emoji: '🛡️', title: 'Aporta al fondo de emergencia',desc: 'Añade cualquier monto a tu fondo de emergencia', points: 100, category: 'Ahorro'    },
  { id: 'read_lesson',    emoji: '🎓', title: 'Lee una microlección completa', desc: 'Completa cualquier lección en la sección Educación',points: 100, category: 'Aprendizaje'},
]

// ── Obtener retos de la semana (2 estables por número de semana) ──

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getWeekChallenges(): [Challenge, Challenge] {
  const week = getWeekNumber(new Date())
  const i1 = week % ALL_CHALLENGES.length
  const i2 = (week + 3) % ALL_CHALLENGES.length
  return [ALL_CHALLENGES[i1], ALL_CHALLENGES[i2 === i1 ? (i2 + 1) % ALL_CHALLENGES.length : i2]]
}

function weekKey(challengeId: string): string {
  const week = getWeekNumber(new Date())
  const year = new Date().getFullYear()
  return `flowcheck_challenge_${year}_w${week}_${challengeId}`
}

// ── Componente ────────────────────────────────────────────────

interface WeeklyChallengesProps {
  userId:  string | undefined
  onPointsEarned?: (newTotal: number) => void
}

export function WeeklyChallenges({ userId, onPointsEarned }: WeeklyChallengesProps) {
  const navigate   = useNavigate()
  const [challenges] = useState<[Challenge, Challenge]>(() => getWeekChallenges())

  // Estado de completado (localStorage para UX inmediata)
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {}
    challenges.forEach((c) => {
      result[c.id] = !!localStorage.getItem(weekKey(c.id))
    })
    return result
  })

  const [claiming, setClaiming] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleComplete = useCallback(async (challenge: Challenge) => {
    if (!userId || completed[challenge.id] || claiming) return

    setClaiming(challenge.id)

    const { data, error } = await supabase.rpc('complete_challenge', {
      p_user_id:     userId,
      p_challenge_id: challenge.id,
    })

    setClaiming(null)

    if (error) {
      showToast(`❌ ${error.message}`)
      return
    }

    const result = data as { success: boolean; new_total_points?: number; error?: string }

    if (!result.success) {
      // Ya completado en DB (seguridad)
      localStorage.setItem(weekKey(challenge.id), '1')
      setCompleted((prev) => ({ ...prev, [challenge.id]: true }))
      showToast('Ya reclamaste este reto esta semana')
      return
    }

    // Éxito
    localStorage.setItem(weekKey(challenge.id), '1')
    setCompleted((prev) => ({ ...prev, [challenge.id]: true }))
    showToast(`🎉 +${challenge.points} pts — ¡Reto completado!`)
    if (result.new_total_points && onPointsEarned) {
      onPointsEarned(result.new_total_points)
    }
  }, [userId, completed, claiming, onPointsEarned])

  const allDone   = challenges.every((c) => completed[c.id])
  const doneCount = challenges.filter((c) => completed[c.id]).length

  return (
    <div
      style={{
        backgroundColor: Colors.card,
        borderRadius: Radius.card,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: `1px solid ${Colors.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${Colors.primaryDark} 0%, ${Colors.primary} 100%)`,
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ fontSize: 15, fontWeight: Font.weightBlack, color: Colors.white, margin: 0, fontFamily: Font.family }}>
            ⚡ Retos de la semana
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: Font.family }}>
            {doneCount}/{challenges.length} completados · +100 pts cada uno
          </p>
        </div>
        {/* Mini progress */}
        <div style={{ display: 'flex', gap: 5 }}>
          {challenges.map((c) => (
            <div
              key={c.id}
              style={{
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: completed[c.id] ? Colors.white : 'rgba(255,255,255,0.3)',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Retos */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {challenges.map((challenge) => {
          const isDone     = completed[challenge.id]
          const isClaiming = claiming === challenge.id

          return (
            <div
              key={challenge.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: 12,
                backgroundColor: isDone ? Colors.primaryLight : Colors.background,
                border: `1px solid ${isDone ? Colors.primary + '40' : Colors.border}`,
                opacity: isDone ? 0.85 : 1,
                transition: 'all 0.3s',
              }}
            >
              {/* Check / Emoji */}
              <div
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: isDone ? Colors.primary : Colors.card,
                  border: `2px solid ${isDone ? Colors.primary : Colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? 18 : 20, flexShrink: 0,
                  transition: 'all 0.3s',
                }}
              >
                {isDone ? '✓' : challenge.emoji}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: Font.weightBold, color: isDone ? Colors.primaryDark : Colors.textPrimary, margin: '0 0 1px', fontFamily: Font.family, textDecoration: isDone ? 'line-through' : 'none' }}>
                  {challenge.title}
                </p>
                <p style={{ fontSize: 11, color: Colors.textMuted, margin: 0, fontFamily: Font.family }}>
                  {challenge.desc}
                </p>
              </div>

              {/* Botón / Badge */}
              {isDone ? (
                <span style={{ fontSize: 11, fontWeight: Font.weightBold, color: Colors.primary, backgroundColor: Colors.primaryLight, borderRadius: 9999, padding: '3px 8px', fontFamily: Font.family, whiteSpace: 'nowrap' }}>
                  +{challenge.points} ✓
                </span>
              ) : (
                <button
                  onClick={() => handleComplete(challenge)}
                  disabled={!!claiming}
                  style={{
                    height: 34, paddingLeft: 12, paddingRight: 12,
                    backgroundColor: Colors.primary, color: Colors.white,
                    borderRadius: 9999, border: 'none',
                    fontSize: 12, fontWeight: Font.weightBold,
                    cursor: claiming ? 'not-allowed' : 'pointer',
                    fontFamily: Font.family, whiteSpace: 'nowrap',
                    opacity: claiming && claiming !== challenge.id ? 0.5 : 1,
                  }}
                >
                  {isClaiming ? '⏳' : `+${challenge.points}`}
                </button>
              )}
            </div>
          )
        })}

        {/* Completados todos */}
        {allDone && (
          <div
            style={{
              backgroundColor: Colors.primaryLight,
              borderRadius: 10, padding: '10px 14px',
              border: `1px solid ${Colors.primaryA30}`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 13, color: Colors.primaryDark, fontWeight: Font.weightBold, margin: 0, fontFamily: Font.family }}>
              🌟 ¡Semana perfecta! Vuelve la próxima semana para nuevos retos.
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 80, left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: Colors.textPrimary, color: Colors.white,
            borderRadius: Radius.button, padding: '11px 18px',
            fontSize: 13, fontWeight: Font.weightBold,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            zIndex: 9999, whiteSpace: 'nowrap',
            fontFamily: Font.family,
            animation: 'toast-in 0.3s ease',
          }}
        >
          {toast}
        </div>
      )}
      <style>{`
        @keyframes toast-in { from { opacity:0; transform: translateX(-50%) translateY(8px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </div>
  )
}
