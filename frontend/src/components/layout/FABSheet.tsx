import React, { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { usePoints } from '../../hooks/usePoints'
import { Colors, Radius, Font } from '../../constants/theme'
import { parseAmount, formatCOP } from '../../utils/formatters'

// ── Categorías rápidas ────────────────────────────────────────

const QUICK_CATS = [
  { key: 'alimentacion', emoji: '🍕', label: 'Comida'    },
  { key: 'transporte',   emoji: '🚌', label: 'Transporte'},
  { key: 'ocio',         emoji: '🎮', label: 'Ocio'      },
  { key: 'salud',        emoji: '💊', label: 'Salud'     },
  { key: 'servicios',    emoji: '💡', label: 'Servicios' },
  { key: 'suscripcion',  emoji: '📺', label: 'Suscripción'},
  { key: 'fijo',         emoji: '🔒', label: 'Fijo'      },
  { key: 'otros',        emoji: '📦', label: 'Otros'     },
] as const

type TxType = 'expense' | 'income'

interface SuccessInfo {
  pointsEarned: number
  newTotal: number
  leisurePenalty: boolean
}

// ── Tipos ─────────────────────────────────────────────────────

interface FABSheetProps {
  open: boolean
  onClose: () => void
}

// ── Componente ────────────────────────────────────────────────

export function FABSheet({ open, onClose }: FABSheetProps) {
  const { session }             = useAuthStore()
  const { registerTransaction } = usePoints(session?.user?.id)
  const navigate                = useNavigate()

  const [txType,   setTxType]   = useState<TxType>('expense')
  const [amount,   setAmount]   = useState('')
  const [cat,      setCat]      = useState('alimentacion')
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState<SuccessInfo | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const parsed    = parseAmount(amount)
  const canSubmit = parsed > 0

  const reset = useCallback(() => {
    setTxType('expense'); setAmount(''); setCat('alimentacion')
    setSaving(false); setSuccess(null); setError(null)
  }, [])

  const handleClose = () => { reset(); onClose() }

  // ── GASTOS: va al registro completo con NudgeModal ────────────
  const handleExpense = () => {
    if (!canSubmit) return
    // Pasa los datos por URL para pre-rellenar el formulario
    onClose()
    reset()
    navigate(`/registrar?amount=${parsed}&category=${cat}`)
  }

  // ── INGRESOS: registro rápido directo ─────────────────────────
  const handleIncome = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    const result = await registerTransaction({
      amount:      parsed,
      category:    'otros',
      description: 'Ingreso rápido',
      date:        new Date().toISOString().slice(0, 10),
      type:        'income',
      nudgeUsed:   false,
      nudgePaused: false,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setSuccess({
      pointsEarned:   result.pointsEarned,
      newTotal:       result.newTotalPoints,
      leisurePenalty: result.leisurePenalty,
    })
    setTimeout(() => { reset(); onClose() }, 2400)
  }

  const handleSubmit = () => {
    if (txType === 'expense') handleExpense()
    else                      handleIncome()
  }

  const content = (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 8000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ── Bottom Sheet ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${open ? '0' : '110%'})`,
          maxWidth: 480,
          width: '100%',
          backgroundColor: Colors.card,
          borderRadius: '24px 24px 0 0',
          zIndex: 8001,
          transition: 'transform 0.35s cubic-bezier(0.34, 1.06, 0.64, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border }} />
        </div>

        <div style={{ padding: '8px 20px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
              Registrar movimiento
            </p>
            <button
              onClick={handleClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textMuted, padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Pantalla de éxito (solo ingresos) ── */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
              <CheckCircle size={52} color={Colors.primary} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 12px' }}>
                ¡Ingreso registrado! 💵
              </p>

              {success.pointsEarned !== 0 && (
                <div style={{
                  backgroundColor: Colors.greenLight,
                  borderRadius: 12, padding: '10px 20px', marginBottom: 12,
                  display: 'inline-block',
                }}>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: Colors.green }}>
                    {success.pointsEarned > 0 ? '+' : ''}{success.pointsEarned} pts
                  </p>
                </div>
              )}

              <p style={{ fontSize: 13, color: Colors.textMuted, margin: 0 }}>
                Total: ⭐ {success.newTotal.toLocaleString('es-CO')} pts
              </p>
            </div>
          ) : (
            <>
              {/* ── Toggle Gasto / Ingreso ── */}
              <div
                style={{
                  display: 'flex', backgroundColor: Colors.background,
                  borderRadius: 12, padding: 3, marginBottom: 20,
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
                      fontWeight: txType === t ? 700 : 500, fontSize: 14,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: txType === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t === 'expense' ? '💸 Gasto' : '💵 Ingreso'}
                  </button>
                ))}
              </div>

              {/* ── Campo de monto ── */}
              <div
                style={{
                  display: 'flex', alignItems: 'center',
                  backgroundColor: Colors.background,
                  borderRadius: 16, padding: '14px 18px',
                  marginBottom: 20, gap: 8,
                  border: `2px solid ${parsed > 0 ? Colors.primary : Colors.border}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 800, color: Colors.primary }}>$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  autoFocus={open}
                  style={{
                    flex: 1, fontSize: 32, fontWeight: 800,
                    color: Colors.textPrimary, border: 'none',
                    outline: 'none', backgroundColor: 'transparent',
                    fontFamily: 'inherit',
                  }}
                />
                {parsed > 0 && (
                  <span style={{ fontSize: 12, color: Colors.textMuted, flexShrink: 0 }}>
                    {formatCOP(parsed)}
                  </span>
                )}
              </div>

              {/* ── Categorías (solo gastos) ── */}
              {txType === 'expense' && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Categoría
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {QUICK_CATS.map(({ key, emoji, label }) => (
                      <button
                        key={key}
                        onClick={() => setCat(key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 12px', borderRadius: Radius.chip,
                          border: `1.5px solid ${cat === key ? Colors.primary : Colors.border}`,
                          backgroundColor: cat === key ? Colors.primaryLight : Colors.card,
                          color: cat === key ? Colors.primary : Colors.textSecondary,
                          fontSize: 12, fontWeight: cat === key ? 700 : 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint para gastos */}
              {txType === 'expense' && canSubmit && (
                <div style={{
                  backgroundColor: Colors.primaryLight,
                  borderRadius: 10, padding: '8px 12px', marginBottom: 14,
                  border: `1px solid ${Colors.primaryA30}`,
                }}>
                  <p style={{ fontSize: 12, color: Colors.primary, margin: 0 }}>
                    🧠 Continuar abre el <strong>análisis de impacto</strong> y te da <strong>+25 pts</strong> por reflexionar
                  </p>
                </div>
              )}

              {/* ── Error ── */}
              {error && (
                <p style={{ fontSize: 13, color: Colors.red, margin: '0 0 12px' }}>{error}</p>
              )}

              {/* ── Botón de envío ── */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
                style={{
                  width: '100%', height: 52,
                  backgroundColor: canSubmit && !saving ? Colors.primary : Colors.border,
                  color: canSubmit && !saving ? '#fff' : Colors.textMuted,
                  borderRadius: Radius.button, border: 'none',
                  fontSize: 15, fontWeight: Font.weightBold,
                  cursor: canSubmit && !saving ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? '⏳ Guardando…'
                  : txType === 'expense' ? 'Continuar →'
                  : 'Registrar ingreso'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
