import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { usePoints, getLevelInfo } from '../../hooks/usePoints'
import { PointsBadge } from '../../components/PointsBadge'
import { Colors } from '../../constants/theme'

// ── Tipos ─────────────────────────────────────────────────────

interface Reward {
  id: string
  name: string
  description: string | null
  category: string
  points_cost: number
  cop_value: number
  icon: string
  available: boolean
}

type Category = 'todos' | 'recargas' | 'comida' | 'transporte'

const CATEGORY_TABS: { key: Category; label: string; emoji: string }[] = [
  { key: 'todos',      label: 'Todos',      emoji: '✨' },
  { key: 'recargas',   label: 'Recargas',   emoji: '📱' },
  { key: 'comida',     label: 'Comida',     emoji: '🍔' },
  { key: 'transporte', label: 'Transporte', emoji: '🚌' },
]

// ── Tasa de conversión ────────────────────────────────────────
// 1000 pts = $5.000 COP → 1 pt = $5 COP

// ── Componente ────────────────────────────────────────────────

export default function MarketplacePage() {
  const navigate              = useNavigate()
  const { session }           = useAuthStore()
  const { profile, refetch }  = useProfile(session?.user?.id)
  const { redeemReward }      = usePoints(session?.user?.id)

  const [rewards,    setRewards]    = useState<Reward[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<Category>('todos')
  const [redeeming,  setRedeeming]  = useState<string | null>(null)  // reward.id en proceso
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirming, setConfirming] = useState<Reward | null>(null)  // modal de confirmación

  const points = profile?.total_points ?? 0
  const level  = profile?.level ?? 1
  const levelInfo = getLevelInfo(points)

  // ── Cargar recompensas ────────────────────────────────────

  useEffect(() => {
    supabase
      .from('rewards')
      .select('*')
      .eq('available', true)
      .order('points_cost', { ascending: true })
      .then(({ data }) => {
        setRewards((data as Reward[]) ?? [])
        setLoading(false)
      })
  }, [])

  // ── Filtrado ──────────────────────────────────────────────

  const filtered = filter === 'todos' ? rewards : rewards.filter(r => r.category === filter)

  // ── Canje ─────────────────────────────────────────────────

  const handleRedeem = async (reward: Reward) => {
    setConfirming(null)
    setRedeeming(reward.id)

    const result = await redeemReward(reward.id)
    setRedeeming(null)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast(`🎉 ¡Canjeaste "${reward.name}"! -${reward.points_cost} pts`, 'success')
    refetch()  // actualizar puntos en el perfil
  }

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Render ────────────────────────────────────────────────

  return (
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
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: Colors.textPrimary }}
        >
          ←
        </button>
        <p style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, margin: 0, flex: 1 }}>
          Marketplace 🏪
        </p>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tarjeta de puntos */}
        {profile && <PointsBadge points={points} />}

        {/* Equivalencia */}
        <div
          style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 10, padding: 12,
            border: `1px solid ${Colors.primaryA30}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>💱</span>
          <p style={{ fontSize: 13, color: Colors.primary, margin: 0, fontWeight: 600 }}>
            1.000 pts = $5.000 COP · Tus puntos valen{' '}
            <strong>${((points / 1000) * 5000).toLocaleString('es-CO')} COP</strong>
          </p>
        </div>

        {/* Filtros por categoría */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="scrollbar-hide">
          {CATEGORY_TABS.map(({ key, label, emoji }) => {
            const isActive = filter === key
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 9999, flexShrink: 0,
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

        {/* Grid de recompensas */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: Colors.textMuted }}>Cargando recompensas…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ color: Colors.textMuted }}>No hay recompensas en esta categoría</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map((reward) => {
              const canAfford    = points >= reward.points_cost
              const isRedeeming  = redeeming === reward.id
              return (
                <div
                  key={reward.id}
                  style={{
                    backgroundColor: Colors.card,
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    border: `1.5px solid ${canAfford ? Colors.border : Colors.border}`,
                    opacity: canAfford ? 1 : 0.65,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                >
                  {/* Ícono + categoría */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 28 }}>{reward.icon}</span>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700,
                        color: Colors.textMuted,
                        backgroundColor: Colors.background,
                        borderRadius: 6, padding: '2px 6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {reward.category}
                    </span>
                  </div>

                  {/* Nombre */}
                  <p style={{ fontSize: 13, fontWeight: 700, color: Colors.textPrimary, margin: 0, lineHeight: '17px' }}>
                    {reward.name}
                  </p>

                  {/* Valor COP */}
                  <p style={{ fontSize: 12, color: Colors.green, fontWeight: 600, margin: 0 }}>
                    Equivale a ${reward.cop_value.toLocaleString('es-CO')} COP
                  </p>

                  {/* Costo en puntos */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12 }}>⭐</span>
                    <span
                      style={{
                        fontSize: 14, fontWeight: 800,
                        color: canAfford ? Colors.primary : Colors.textMuted,
                      }}
                    >
                      {reward.points_cost.toLocaleString('es-CO')} pts
                    </span>
                  </div>

                  {/* Botón canjear */}
                  <button
                    onClick={() => canAfford && setConfirming(reward)}
                    disabled={!canAfford || isRedeeming}
                    style={{
                      width: '100%', height: 36,
                      backgroundColor: canAfford ? Colors.primary : Colors.border,
                      color: canAfford ? Colors.white : Colors.textMuted,
                      borderRadius: 8, border: 'none',
                      fontSize: 12, fontWeight: 700,
                      cursor: canAfford && !isRedeeming ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      marginTop: 2,
                    }}
                  >
                    {isRedeeming ? '⏳…' : canAfford ? 'Canjear' : `Faltan ${(reward.points_cost - points).toLocaleString('es-CO')} pts`}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Historial de canjes (enlace) */}
        <p style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', margin: '8px 0 0' }}>
          Los canjes son procesados en 24-48 horas hábiles.
        </p>

      </div>

      {/* ── Modal de confirmación ───────────────────────────── */}
      {confirming && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, zIndex: 1000,
          }}
          onClick={() => setConfirming(null)}
        >
          <div
            style={{
              backgroundColor: Colors.card, borderRadius: 20,
              padding: 24, width: '100%', maxWidth: 360,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: 40, marginBottom: 8 }}>{confirming.icon}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 6px' }}>
              ¿Confirmar canje?
            </p>
            <p style={{ fontSize: 14, color: Colors.textSecondary, margin: '0 0 16px' }}>
              <strong>{confirming.name}</strong>
              <br />
              Se descontarán <strong style={{ color: Colors.primary }}>
                {confirming.points_cost.toLocaleString('es-CO')} pts
              </strong> de tu saldo
            </p>
            <p style={{ fontSize: 13, color: Colors.textMuted, margin: '0 0 20px' }}>
              Saldo restante: <strong>{(points - confirming.points_cost).toLocaleString('es-CO')} pts</strong>
            </p>
            <button
              onClick={() => handleRedeem(confirming)}
              disabled={!!redeeming}
              style={{
                width: '100%', height: 48,
                backgroundColor: Colors.primary, color: Colors.white,
                borderRadius: 12, border: 'none',
                fontSize: 15, fontWeight: 700,
                cursor: 'pointer', marginBottom: 10,
                fontFamily: 'inherit',
              }}
            >
              {redeeming ? '⏳ Procesando…' : '✅ Confirmar canje'}
            </button>
            <button
              onClick={() => setConfirming(null)}
              style={{
                background: 'none', border: 'none',
                color: Colors.textSecondary, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Toast de resultado ───────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'success' ? Colors.green : Colors.red,
            color: Colors.white,
            borderRadius: 12, padding: '12px 20px',
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 2000, maxWidth: 340,
            animation: 'slideUp 0.3s ease',
            textAlign: 'center',
          }}
        >
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity:0 } to { transform: translateX(-50%) translateY(0); opacity:1 } }
      `}</style>
    </div>
  )
}
