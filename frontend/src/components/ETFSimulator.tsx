import React, { useState, useMemo } from 'react'
import { Colors, Radius, Font } from '../constants/theme'

// ── Lógica de cálculo ─────────────────────────────────────────

interface Scenario {
  id:       string
  label:    string
  emoji:    string
  rateEA:   number   // % anual efectivo
  color:    string
  desc:     string
}

const SCENARIOS: Scenario[] = [
  {
    id:     'colchon',
    label:  'En el colchón',
    emoji:  '🛋️',
    rateEA: 0,
    color:  Colors.textMuted,
    desc:   'Sin rendimiento. La inflación (≈5% en Col.) erosiona el poder adquisitivo.',
  },
  {
    id:     'cdt',
    label:  'CDT Bancario',
    emoji:  '🏦',
    rateEA: 10,
    color:  Colors.yellow,
    desc:   'Tasa fija garantizada. Sin riesgo de mercado. Ideal para perfil conservador.',
  },
  {
    id:     'etf',
    label:  'ETF S&P 500',
    emoji:  '🚀',
    rateEA: 12,
    color:  Colors.primary,
    desc:   'Promedio histórico del índice S&P 500 en USD ≈12% EA. Volatilidad real, retorno superior a largo plazo.',
  },
]

function fvMonthly(initial: number, monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return initial + monthly * n
  return initial * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r)
}

function formatM(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${Math.round(v).toLocaleString('es-CO')}`
}

// ── Slider ────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: Font.weightBold, color: Colors.textPrimary, fontFamily: Font.family }}>
          {label}
        </label>
        <span style={{ fontSize: 14, fontWeight: Font.weightBold, color: Colors.primary, fontFamily: Font.family }}>
          {display}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: Colors.primary, cursor: 'pointer' }}
      />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function ETFSimulator() {
  const [initial, setInitial] = useState(1_000_000)
  const [monthly, setMonthly] = useState(200_000)
  const [years,   setYears]   = useState(10)

  const results = useMemo(() =>
    SCENARIOS.map((s) => ({
      ...s,
      finalValue:      Math.round(fvMonthly(initial, monthly, s.rateEA, years)),
      totalContributed: initial + monthly * years * 12,
    })),
    [initial, monthly, years],
  )

  const maxValue   = Math.max(...results.map((r) => r.finalValue))
  const etfResult  = results.find((r) => r.id === 'etf')!
  const cashResult = results.find((r) => r.id === 'colchon')!
  const gainVsCash = etfResult.finalValue - cashResult.finalValue

  return (
    <div style={{ backgroundColor: Colors.card, borderRadius: Radius.card, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 16, fontWeight: Font.weightBlack, color: Colors.textPrimary, margin: '0 0 4px', fontFamily: Font.family }}>
        📊 Colchón vs CDT vs ETF S&P 500
      </p>
      <p style={{ fontSize: 13, color: Colors.textSecondary, margin: '0 0 20px', fontFamily: Font.family }}>
        Compara lo que rinde tu dinero según dónde lo guardes
      </p>

      {/* Controles */}
      <Slider
        label="Capital inicial"
        value={initial} min={0} max={10_000_000} step={500_000}
        display={`$${initial.toLocaleString('es-CO')}`}
        onChange={setInitial}
      />
      <Slider
        label="Aporte mensual"
        value={monthly} min={50_000} max={2_000_000} step={50_000}
        display={`$${monthly.toLocaleString('es-CO')}/mes`}
        onChange={setMonthly}
      />
      <Slider
        label="Horizonte de tiempo"
        value={years} min={1} max={20} step={1}
        display={`${years} años`}
        onChange={setYears}
      />

      {/* Resultados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        {results.map((r) => {
          const barPct = (r.finalValue / maxValue) * 100
          const gain   = r.finalValue - r.totalContributed

          return (
            <div
              key={r.id}
              style={{
                backgroundColor: Colors.background,
                borderRadius: 12, padding: 14,
                border: r.id === 'etf' ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{r.emoji}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: Font.weightBold, color: Colors.textPrimary, margin: 0, fontFamily: Font.family }}>
                      {r.label}
                      {r.id === 'etf' && (
                        <span style={{ marginLeft: 6, fontSize: 10, backgroundColor: Colors.primaryLight, color: Colors.primary, borderRadius: 4, padding: '1px 5px', fontWeight: Font.weightBold }}>
                          Recomendado largo plazo
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 11, color: Colors.textMuted, margin: 0, fontFamily: Font.family }}>
                      {r.rateEA === 0 ? 'Sin rendimiento' : `${r.rateEA}% EA`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: Font.weightBlack, color: r.color, margin: 0, fontFamily: Font.family }}>
                    {formatM(r.finalValue)}
                  </p>
                  {gain > 0 && (
                    <p style={{ fontSize: 11, color: Colors.primary, margin: 0, fontFamily: Font.family }}>
                      +{formatM(gain)} de intereses
                    </p>
                  )}
                </div>
              </div>

              {/* Barra proporcional */}
              <div style={{ height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${barPct}%`,
                    backgroundColor: r.color,
                    borderRadius: 4,
                    transition: 'width 0.6s ease',
                    opacity: r.id === 'colchon' ? 0.5 : 1,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Insight principal */}
      <div
        style={{
          backgroundColor: Colors.primaryLight,
          borderRadius: 12, padding: 14, marginTop: 14,
          border: `1px solid ${Colors.primaryA30}`,
        }}
      >
        <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px', fontFamily: Font.family }}>
          💡 Invertir en ETF S&P 500 en lugar de guardar en el colchón generaría{' '}
          <strong style={{ color: Colors.primary }}>{formatM(gainVsCash)} adicionales</strong>{' '}
          en {years} años. El tiempo y la capitalización hacen el trabajo.
        </p>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: Colors.textMuted, margin: '12px 0 0', textAlign: 'center', lineHeight: '15px', fontFamily: Font.family }}>
        * Tasas históricas. El S&P 500 puede ser negativo en años específicos — el promedio es positivo a 10+ años.
        No es asesoría financiera.
      </p>
    </div>
  )
}
