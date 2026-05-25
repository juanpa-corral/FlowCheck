import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { usePoints } from '../../hooks/usePoints'
import { NudgeModal } from '../../components/NudgeModal'
import { Colors } from '../../constants/theme'
import { parseAmount, formatCOP } from '../../utils/formatters'

// ── Categorías ────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'alimentacion', label: 'Alimentación', emoji: '🍕' },
  { key: 'transporte',   label: 'Transporte',   emoji: '🚌' },
  { key: 'ocio',         label: 'Ocio',         emoji: '🎮' },
  { key: 'educacion',    label: 'Educación',    emoji: '📚' },
  { key: 'salud',        label: 'Salud',        emoji: '💊' },
  { key: 'servicios',    label: 'Servicios',    emoji: '💡' },
  { key: 'suscripcion',  label: 'Suscripción',  emoji: '📺' },
  { key: 'fijo',         label: 'Gasto Fijo',   emoji: '🔒' },
  { key: 'otros',        label: 'Otros',        emoji: '📦' },
] as const

// ── Tipos ────────────────────────────────────────────────────

type TxType = 'expense' | 'income'

interface SuccessInfo {
  pointsEarned: number
  newTotal: number
  leisurePenalty: boolean
}

// ── Componente ────────────────────────────────────────────────

export default function AddTransactionPage() {
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()
  const { session }      = useAuthStore()
  const { profile }      = useProfile(session?.user?.id)
  const { registerTransaction } = usePoints(session?.user?.id)

  // Pre-rellenar desde FABSheet via URL params (?amount=X&category=Y)
  const prefillAmount   = searchParams.get('amount') ?? ''
  const prefillCategory = searchParams.get('category') ?? 'alimentacion'

  // Formulario
  const [txType,       setTxType]       = useState<TxType>('expense')
  const [amount,       setAmount]       = useState(prefillAmount)
  const [category,     setCategory]     = useState(prefillCategory)
  const [description,  setDescription]  = useState('')
  const [date,         setDate]         = useState(new Date().toISOString().slice(0, 10))

  // UI state
  const [showNudge,    setShowNudge]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState<SuccessInfo | null>(null)
  const [nudgePaused,  setNudgePaused]  = useState(false)

  const parsedAmount = parseAmount(amount)
  const canSubmit    = parsedAmount > 0 && !!category

  // ── Flujo de envío ────────────────────────────────────────

  const handleSubmitForm = () => {
    setError(null)
    if (!canSubmit) { setError('Ingresa un monto válido.'); return }
    if (txType === 'expense') {
      setShowNudge(true)        // Mostrar nudge antes de guardar
    } else {
      saveTransaction(false, false)
    }
  }

  const saveTransaction = async (nudgeUsed: boolean, nudgePaused: boolean) => {
    setShowNudge(false)
    setSaving(true)
    const result = await registerTransaction({
      amount:      parsedAmount,
      category,
      description: description.trim() || category,
      date,
      type:        txType,
      nudgeUsed,
      nudgePaused,
    })
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess({
      pointsEarned:   result.pointsEarned,
      newTotal:       result.newTotalPoints,
      leisurePenalty: result.leisurePenalty,
    })
  }

  // ── Callbacks del NudgeModal ──────────────────────────────

  const handleNudgeConfirmDirect = () => saveTransaction(true, false)
  const handleNudgePauseConfirm  = () => saveTransaction(true, true)
  const handleNudgeCancel        = () => { setShowNudge(false); setNudgePaused(false) }

  // ── Pantalla de éxito ─────────────────────────────────────

  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh', backgroundColor: Colors.background,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 60, marginBottom: 12 }}>
          {success.leisurePenalty ? '⚠️' : '🎉'}
        </p>
        <p style={{ fontSize: 22, fontWeight: 800, color: Colors.textPrimary, margin: '0 0 8px' }}>
          {success.leisurePenalty ? '¡Gasto registrado!' : '¡Registrado con éxito!'}
        </p>

        {success.pointsEarned !== 0 && (
          <div
            style={{
              backgroundColor: success.pointsEarned > 0 ? Colors.greenLight : Colors.redLight,
              borderRadius: 12, padding: '10px 20px',
              marginBottom: 12,
            }}
          >
            <p style={{
              fontSize: 16, fontWeight: 700, margin: 0,
              color: success.pointsEarned > 0 ? Colors.green : Colors.red,
            }}>
              {success.pointsEarned > 0 ? '+' : ''}{success.pointsEarned} pts
              {success.leisurePenalty && ' (penalización aplicada)'}
            </p>
          </div>
        )}

        <p style={{ fontSize: 14, color: Colors.textSecondary, margin: '0 0 4px' }}>
          Total de puntos:
        </p>
        <p style={{ fontSize: 20, fontWeight: 800, color: Colors.primary, margin: '0 0 28px' }}>
          ⭐ {success.newTotal.toLocaleString('es-CO')} pts
        </p>

        {success.leisurePenalty && (
          <div
            style={{
              backgroundColor: Colors.yellowLight,
              borderRadius: 10, padding: 12,
              marginBottom: 20, textAlign: 'left',
              border: `1px solid ${Colors.yellowA40}`,
            }}
          >
            <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px' }}>
              💡 <strong>Consejo:</strong> Aumentar tu fondo de emergencia y reducir el ocio
              al 30% del ingreso eliminará esta penalización.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%', height: 52,
            backgroundColor: Colors.primary, color: Colors.white,
            borderRadius: 12, border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: 10,
          }}
        >
          Volver al dashboard
        </button>
        <button
          onClick={() => {
            setSuccess(null); setAmount(''); setDescription('')
            setCategory('alimentacion'); setNudgePaused(false)
          }}
          style={{
            background: 'none', border: 'none',
            color: Colors.textSecondary, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Registrar otro gasto
        </button>
      </div>
    )
  }

  // ── Formulario ────────────────────────────────────────────

  return (
    <>
      <div style={{ minHeight: '100vh', backgroundColor: Colors.background }}>
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 20px',
            backgroundColor: Colors.card,
            borderBottom: `1px solid ${Colors.border}`,
          }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none', border: 'none',
              fontSize: 22, cursor: 'pointer', color: Colors.textPrimary,
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <p style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
            Registrar movimiento
          </p>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Toggle Ingreso / Gasto */}
          <div
            style={{
              display: 'flex', backgroundColor: Colors.border,
              borderRadius: 12, padding: 3,
            }}
          >
            {(['expense', 'income'] as TxType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTxType(t)}
                style={{
                  flex: 1, height: 40, borderRadius: 10, border: 'none',
                  backgroundColor: txType === t ? Colors.card : 'transparent',
                  color: txType === t ? Colors.textPrimary : Colors.textMuted,
                  fontWeight: txType === t ? 700 : 500,
                  fontSize: 14, cursor: 'pointer',
                  boxShadow: txType === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                {t === 'expense' ? '💸 Gasto' : '💵 Ingreso'}
              </button>
            ))}
          </div>

          {/* Monto */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, display: 'block', marginBottom: 6 }}>
              Monto *
            </label>
            <div
              style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${parsedAmount > 0 ? Colors.primary : Colors.border}`,
                borderRadius: 10, backgroundColor: Colors.card,
                padding: '0 16px', height: 60, gap: 6,
                transition: 'border-color 0.2s',
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 700, color: Colors.primary }}>$</span>
              <input
                type="text" inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                style={{
                  flex: 1, fontSize: 24, fontWeight: 700,
                  color: Colors.textPrimary, border: 'none',
                  outline: 'none', backgroundColor: 'transparent',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            {parsedAmount > 0 && (
              <p style={{ fontSize: 12, color: Colors.textMuted, margin: '4px 0 0', textAlign: 'right' }}>
                {formatCOP(parsedAmount)}
              </p>
            )}
          </div>

          {/* Categoría (solo para gastos) */}
          {txType === 'expense' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, display: 'block', marginBottom: 8 }}>
                Categoría *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(({ key, label, emoji }) => {
                  const isActive = category === key
                  return (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 12px', borderRadius: 9999,
                        border: `1.5px solid ${isActive ? Colors.primary : Colors.border}`,
                        backgroundColor: isActive ? Colors.primaryLight : Colors.card,
                        color: isActive ? Colors.primary : Colors.textSecondary,
                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {emoji} {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, display: 'block', marginBottom: 6 }}>
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Almuerzo con amigos"
              style={{
                width: '100%', height: 48,
                border: `1.5px solid ${Colors.border}`,
                borderRadius: 10, padding: '0 14px',
                fontSize: 15, color: Colors.textPrimary,
                backgroundColor: Colors.card,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Fecha */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, display: 'block', marginBottom: 6 }}>
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%', height: 48,
                border: `1.5px solid ${Colors.border}`,
                borderRadius: 10, padding: '0 14px',
                fontSize: 15, color: Colors.textPrimary,
                backgroundColor: Colors.card,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Info de puntos disponibles */}
          {txType === 'expense' && (
            <div
              style={{
                backgroundColor: Colors.primaryLight,
                borderRadius: 10, padding: 12,
                border: `1px solid ${Colors.primaryA30}`,
              }}
            >
              <p style={{ fontSize: 12, color: Colors.primary, margin: 0, lineHeight: '18px' }}>
                💡 <strong>Gana puntos registrando:</strong>
                {' '}+5 hoy · +10 por usar pre-registro · +25 por reflexionar antes de gastar
              </p>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: Colors.redLight, borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 14, color: Colors.red, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Botón continuar */}
          <button
            onClick={handleSubmitForm}
            disabled={!canSubmit || saving}
            style={{
              width: '100%', height: 52,
              backgroundColor: canSubmit && !saving ? Colors.primary : Colors.border,
              color: canSubmit && !saving ? Colors.white : Colors.textMuted,
              borderRadius: 12, border: 'none',
              fontSize: 16, fontWeight: 700,
              cursor: canSubmit && !saving ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {saving ? '⏳ Guardando…' : txType === 'expense' ? 'Continuar →' : 'Registrar ingreso'}
          </button>

        </div>
      </div>

      {/* Nudge Modal — aparece solo para gastos */}
      {showNudge && profile && (
        <NudgeModal
          amount={parsedAmount}
          category={category}
          profile={profile}
          onConfirmDirect={handleNudgeConfirmDirect}
          onPauseAndConfirm={handleNudgePauseConfirm}
          onCancel={handleNudgeCancel}
        />
      )}
    </>
  )
}
