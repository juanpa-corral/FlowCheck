import React, { useState, useMemo } from 'react'
import { Colors } from '../constants/theme'

// ── Helpers ───────────────────────────────────────────────────

function calcCompoundFuture(
  initial: number,
  monthly: number,
  annualRatePct: number,
  years: number,
): { futureValue: number; totalContributed: number; interestEarned: number } {
  const r = annualRatePct / 100 / 12   // tasa mensual
  const n = years * 12                  // periodos

  let futureValue: number
  if (r === 0) {
    futureValue = initial + monthly * n
  } else {
    // Valor futuro del capital inicial
    const fvInitial = initial * Math.pow(1 + r, n)
    // Valor futuro de la anualidad (aportes mensuales)
    const fvAnnuity = monthly * ((Math.pow(1 + r, n) - 1) / r)
    futureValue = fvInitial + fvAnnuity
  }

  const totalContributed = initial + monthly * n
  const interestEarned   = futureValue - totalContributed

  return {
    futureValue:      Math.round(futureValue),
    totalContributed: Math.round(totalContributed),
    interestEarned:   Math.round(interestEarned),
  }
}

function formatM(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`
  return `$${value.toLocaleString('es-CO')}`
}

// ── Slider personalizado ──────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  display: string
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step, unit, display, onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 700, color: Colors.primary }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: Colors.primary,
          cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: Colors.textMuted }}>{min}{unit}</span>
        <span style={{ fontSize: 10, color: Colors.textMuted }}>{max}{unit}</span>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function CompoundInterestSimulator() {
  const [initial,  setInitial]  = useState(500_000)     // COP
  const [monthly,  setMonthly]  = useState(200_000)     // COP/mes
  const [ratePct,  setRatePct]  = useState(8)            // % EA
  const [years,    setYears]    = useState(10)           // años

  const result = useMemo(
    () => calcCompoundFuture(initial, monthly, ratePct, years),
    [initial, monthly, ratePct, years],
  )

  const contributedPct = result.futureValue > 0
    ? (result.totalContributed / result.futureValue) * 100
    : 0
  const interestPct = 100 - contributedPct

  return (
    <div
      style={{
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <p style={{ fontSize: 16, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 4px' }}>
        🧮 Simulador de Interés Compuesto
      </p>
      <p style={{ fontSize: 13, color: Colors.textSecondary, margin: '0 0 20px' }}>
        Mueve los valores y ve cómo crece tu dinero en el tiempo
      </p>

      {/* Sliders */}
      <Slider
        label="Capital inicial"
        value={initial}
        min={0}
        max={10_000_000}
        step={100_000}
        unit=""
        display={`$${initial.toLocaleString('es-CO')}`}
        onChange={setInitial}
      />
      <Slider
        label="Aporte mensual"
        value={monthly}
        min={50_000}
        max={2_000_000}
        step={50_000}
        unit=""
        display={`$${monthly.toLocaleString('es-CO')}/mes`}
        onChange={setMonthly}
      />
      <Slider
        label="Tasa de rentabilidad"
        value={ratePct}
        min={1}
        max={20}
        step={0.5}
        unit="%"
        display={`${ratePct}% EA`}
        onChange={setRatePct}
      />
      <Slider
        label="Horizonte de tiempo"
        value={years}
        min={1}
        max={40}
        step={1}
        unit=" años"
        display={`${years} años`}
        onChange={setYears}
      />

      {/* Resultado */}
      <div
        style={{
          backgroundColor: Colors.primaryLight,
          borderRadius: 14,
          padding: 16,
          marginTop: 4,
        }}
      >
        <p style={{ fontSize: 12, color: Colors.textSecondary, margin: '0 0 4px', textAlign: 'center' }}>
          Tu dinero en {years} años valdría
        </p>
        <p
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: Colors.primary,
            margin: '0 0 16px',
            textAlign: 'center',
          }}
        >
          {formatM(result.futureValue)}
        </p>

        {/* Barra de composición */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              height: 14,
              borderRadius: 9999,
              overflow: 'hidden',
              display: 'flex',
              backgroundColor: Colors.border,
            }}
          >
            <div
              style={{
                width: `${contributedPct}%`,
                backgroundColor: Colors.primary,
                transition: 'width 0.5s ease',
              }}
            />
            <div
              style={{
                width: `${interestPct}%`,
                backgroundColor: Colors.green,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.primary }} />
              <span style={{ fontSize: 11, color: Colors.textMuted }}>Aportado</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: Colors.primary, margin: 0 }}>
              {formatM(result.totalContributed)}
            </p>
          </div>
          <div style={{ width: 1, backgroundColor: Colors.border }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.green }} />
              <span style={{ fontSize: 11, color: Colors.textMuted }}>Intereses</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: Colors.green, margin: 0 }}>
              +{formatM(result.interestEarned)}
            </p>
          </div>
        </div>

        {result.interestEarned > result.totalContributed && (
          <p
            style={{
              fontSize: 12,
              color: Colors.green,
              fontWeight: 600,
              textAlign: 'center',
              margin: '12px 0 0',
            }}
          >
            🎉 Los intereses superan lo que aportaste. ¡El tiempo hizo su trabajo!
          </p>
        )}
      </div>

      <p style={{ fontSize: 11, color: Colors.textMuted, margin: '12px 0 0', textAlign: 'center', lineHeight: '15px' }}>
        * Simulación con capitalización mensual y tasa constante. Rentabilidades pasadas no garantizan resultados futuros.
      </p>
    </div>
  )
}
