import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAnalytics, type CategoryComparison } from '../../hooks/useAnalytics'
import { useTransactions } from '../../hooks/useTransactions'
import { GhostExpensesWidget } from '../../components/GhostExpensesWidget'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Colors, Radius, Font } from '../../constants/theme'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function pctLabel(pct: number | null): string {
  if (pct === null) return 'Nuevo'
  if (pct === 0)    return '= Igual'
  return pct > 0 ? `+${pct}%` : `${pct}%`
}

// ── Mapa de emojis por categoría ──────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  alimentacion: '🍕',
  transporte:   '🚌',
  ocio:         '🎮',
  educacion:    '📚',
  salud:        '💊',
  servicios:    '💡',
  suscripcion:  '📺',
  fijo:         '🔒',
  otros:        '📦',
}

const CAT_LABEL: Record<string, string> = {
  alimentacion: 'Alimentación',
  transporte:   'Transporte',
  ocio:         'Ocio',
  educacion:    'Educación',
  salud:        'Salud',
  servicios:    'Servicios',
  suscripcion:  'Suscripciones',
  fijo:         'Gastos Fijos',
  otros:        'Otros',
}

// ── Sub-componente: Barra comparativa ─────────────────────────

function CategoryBar({ cat, maxValue }: { cat: CategoryComparison; maxValue: number }) {
  const curPct  = maxValue > 0 ? (cat.currentMonth / maxValue) * 100 : 0
  const prevPct = maxValue > 0 ? (cat.prevMonth    / maxValue) * 100 : 0
  const pctBadgeColor =
    cat.changePct === null          ? Colors.textMuted
    : cat.changePct > 0             ? Colors.red
    : cat.changePct < 0             ? Colors.primary
    :                                 Colors.textMuted

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Etiqueta + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{CAT_EMOJI[cat.category] ?? '💰'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>
            {CAT_LABEL[cat.category] ?? cat.category}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: pctBadgeColor }}>
            {pctLabel(cat.changePct)}
          </span>
          <span style={{ fontSize: 12, color: Colors.textMuted }}>
            {fmt(cat.currentMonth)}
          </span>
        </div>
      </div>

      {/* Barra mes actual (verde) */}
      <div
        style={{
          height: 8,
          backgroundColor: Colors.border,
          borderRadius: 4,
          marginBottom: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, curPct)}%`,
            backgroundColor: Colors.primary,
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {/* Barra mes anterior (gris) */}
      {cat.prevMonth > 0 && (
        <div
          style={{
            height: 5,
            backgroundColor: Colors.border,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, prevPct)}%`,
              backgroundColor: Colors.textMuted,
              borderRadius: 4,
              opacity: 0.5,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      )}

      {/* Etiqueta mes anterior */}
      {cat.prevMonth > 0 && (
        <p style={{ fontSize: 10, color: Colors.textMuted, margin: '3px 0 0', textAlign: 'right' }}>
          Anterior: {fmt(cat.prevMonth)}
        </p>
      )}
    </div>
  )
}

// ── Sub-componente: Stat card ─────────────────────────────────

function StatCard({
  emoji, label, current, prev, pct,
}: {
  emoji: string
  label: string
  current: number
  prev: number
  pct: number | null
}) {
  const pctColor = pct === null ? Colors.textMuted : pct >= 0 ? Colors.primary : Colors.red
  const sign     = pct !== null && pct >= 0 ? '+' : ''

  return (
    <div
      style={{
        backgroundColor: Colors.card,
        borderRadius: Radius.card,
        padding: 14,
        flex: 1,
        border: `1px solid ${Colors.border}`,
      }}
    >
      <p style={{ fontSize: 20, margin: '0 0 4px' }}>{emoji}</p>
      <p style={{ fontSize: 11, color: Colors.textMuted, margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 17, fontWeight: 800, color: Colors.textPrimary, margin: '0 0 2px' }}>
        {fmt(current)}
      </p>
      {prev > 0 && (
        <p style={{ fontSize: 11, margin: 0 }}>
          <span style={{ color: pctColor, fontWeight: 700 }}>
            {sign}{pct}%
          </span>{' '}
          <span style={{ color: Colors.textMuted }}>vs ant.</span>
        </p>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function AnaliticaPage() {
  const navigate        = useNavigate()
  const { session }     = useAuthStore()
  const { data, loading } = useAnalytics(session?.user?.id)
  const { ghostTotal }    = useTransactions(session?.user?.id)

  const [activeTab, setActiveTab] = useState<'resumen' | 'categorias' | 'fantasma'>('resumen')

  if (loading) return <LoadingSpinner fullScreen message="Calculando tu mes…" />

  const maxCatValue = data
    ? Math.max(...data.categories.map((c) => Math.max(c.currentMonth, c.prevMonth)), 1)
    : 1

  const savingsPct =
    data?.savingsChangePct !== null && data?.savingsChangePct !== undefined
      ? data.savingsChangePct
      : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background, paddingBottom: 48 }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          backgroundColor: Colors.card,
          borderBottom: `1px solid ${Colors.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: Colors.textPrimary, lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          <p style={{ fontSize: 17, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
            Mi Mes Financiero
          </p>
          {data && (
            <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0 }}>
              {data.curMonthLabel} vs {data.prevMonthLabel}
            </p>
          )}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            backgroundColor: Colors.border,
            borderRadius: 12,
            padding: 3,
            gap: 2,
          }}
        >
          {([
            { key: 'resumen',    label: '📊 Resumen' },
            { key: 'categorias', label: '📋 Categorías' },
            { key: 'fantasma',   label: '👻 Fantasma' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, height: 38, borderRadius: 10, border: 'none',
                backgroundColor: activeTab === key ? Colors.card : 'transparent',
                color: activeTab === key ? Colors.textPrimary : Colors.textMuted,
                fontWeight: activeTab === key ? 700 : 500,
                fontSize: 12, cursor: 'pointer',
                boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Resumen ── */}
        {activeTab === 'resumen' && (
          <>
            {!data || (data.totalCurrentMonth === 0 && data.totalPrevMonth === 0) ? (
              <div
                style={{
                  backgroundColor: Colors.card,
                  borderRadius: Radius.card,
                  padding: 32,
                  textAlign: 'center',
                  border: `1px solid ${Colors.border}`,
                }}
              >
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📭</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 6px' }}>
                  Sin datos para comparar
                </p>
                <p style={{ fontSize: 13, color: Colors.textMuted, margin: 0 }}>
                  Registra tus gastos este mes y el próximo tendrás tu primera retrospectiva.
                </p>
              </div>
            ) : (
              <>
                {/* Stats globales */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <StatCard
                    emoji="📉"
                    label="Gastos"
                    current={data.totalCurrentMonth}
                    prev={data.totalPrevMonth}
                    pct={
                      data.totalPrevMonth > 0
                        ? Math.round(((data.totalCurrentMonth - data.totalPrevMonth) / data.totalPrevMonth) * 100)
                        : null
                    }
                  />
                  <StatCard
                    emoji="🏦"
                    label="Ahorro potencial"
                    current={data.savingsCurrent}
                    prev={data.savingsPrev}
                    pct={savingsPct}
                  />
                </div>

                {/* Headline de ahorro */}
                {savingsPct !== null && (
                  <div
                    style={{
                      backgroundColor: savingsPct >= 0 ? Colors.greenLight : Colors.redLight,
                      borderRadius: 14,
                      padding: 16,
                      border: `1px solid ${savingsPct >= 0 ? Colors.primaryA30 : Colors.redA30}`,
                      textAlign: 'center',
                    }}
                  >
                    <p style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: savingsPct >= 0 ? Colors.primary : Colors.red,
                      margin: '0 0 4px',
                    }}>
                      {savingsPct >= 0 ? '🎉' : '📊'}{' '}
                      {savingsPct >= 0
                        ? `Ahorraste ${savingsPct}% más`
                        : `Ahorraste ${Math.abs(savingsPct)}% menos`}
                    </p>
                    <p style={{ fontSize: 13, color: Colors.textSecondary, margin: 0 }}>
                      que el mes pasado
                    </p>
                  </div>
                )}

                {/* Recomendación dinámica */}
                {data.recommendation && (
                  <div
                    style={{
                      backgroundColor: Colors.card,
                      borderRadius: 14,
                      padding: 16,
                      border: `1px solid ${Colors.primaryA20}`,
                      borderLeft: `4px solid ${Colors.primary}`,
                    }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 700, color: Colors.primary, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      💡 Recomendación
                    </p>
                    <p style={{ fontSize: 14, color: Colors.textPrimary, margin: 0, lineHeight: '20px' }}>
                      {data.recommendation}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Tab: Categorías ── */}
        {activeTab === 'categorias' && (
          <div
            style={{
              backgroundColor: Colors.card,
              borderRadius: Radius.card,
              padding: 16,
              border: `1px solid ${Colors.border}`,
            }}
          >
            {/* Leyenda */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 12, height: 8, borderRadius: 3, backgroundColor: Colors.primary }} />
                <span style={{ fontSize: 11, color: Colors.textMuted }}>Este mes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 12, height: 5, borderRadius: 3, backgroundColor: Colors.textMuted, opacity: 0.5 }} />
                <span style={{ fontSize: 11, color: Colors.textMuted }}>Mes pasado</span>
              </div>
            </div>

            {!data || data.categories.length === 0 ? (
              <p style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', padding: '20px 0' }}>
                Sin transacciones registradas este mes.
              </p>
            ) : (
              data.categories.map((cat) => (
                <CategoryBar key={cat.category} cat={cat} maxValue={maxCatValue} />
              ))
            )}
          </div>
        )}

        {/* ── Tab: Gastos Fantasma ── */}
        {activeTab === 'fantasma' && (
          <>
            <GhostExpensesWidget monthlyGhostTotal={ghostTotal} />

            <div
              style={{
                backgroundColor: Colors.card,
                borderRadius: Radius.card,
                padding: 16,
                border: `1px solid ${Colors.border}`,
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 12px' }}>
                ¿Qué son los gastos fantasma?
              </p>
              {[
                {
                  emoji: '📺',
                  title: 'Suscripciones de streaming',
                  desc: 'Netflix, Disney+, HBO — ¿cuántos usas activamente?',
                },
                {
                  emoji: '🎵',
                  title: 'Música y podcasts',
                  desc: 'Spotify, Apple Music — considera el plan familiar.',
                },
                {
                  emoji: '☁️',
                  title: 'Almacenamiento en la nube',
                  desc: 'Google One, iCloud — ¿cuánto espacio realmente necesitas?',
                },
                {
                  emoji: '🔒',
                  title: 'Gastos fijos olvidados',
                  desc: 'Membresías de gym, seguros, cuotas que se debitan solos.',
                },
              ].map(({ emoji, title, desc }) => (
                <div
                  key={title}
                  style={{
                    display: 'flex',
                    gap: 10,
                    paddingBottom: 12,
                    marginBottom: 12,
                    borderBottom: `1px solid ${Colors.border}`,
                  }}
                >
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{emoji}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, margin: '0 0 2px' }}>
                      {title}
                    </p>
                    <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}

              <div
                style={{
                  backgroundColor: Colors.primaryLight,
                  borderRadius: 10,
                  padding: 12,
                  border: `1px solid ${Colors.primaryA30}`,
                }}
              >
                <p style={{ fontSize: 12, color: Colors.primary, margin: 0, lineHeight: '18px' }}>
                  💡 <strong>Tip:</strong> Registra tus pagos recurrentes con la categoría
                  "Suscripción" o "Gasto Fijo" para que aparezcan aquí automáticamente.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
