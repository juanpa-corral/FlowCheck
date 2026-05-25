import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { ETFSimulator } from '../../components/ETFSimulator'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Colors } from '../../constants/theme'
import type { RiskProfile } from '../../types/database'

// ── Tipos ─────────────────────────────────────────────────────

interface InvestmentOption {
  name: string
  emoji: string
  returnRange: string   // "8% – 12% EA"
  risk: 'Bajo' | 'Medio' | 'Medio-Alto' | 'Alto'
  liquidity: 'Alta' | 'Media' | 'Baja'
  minAmount: string
  description: string
  platforms: string[]
  tag?: string         // "Recomendado" | "Popular" | etc.
}

interface RiskConfig {
  emoji: string
  color: string
  label: string
  description: string
  headline: string
  options: InvestmentOption[]
}

// ── Datos por perfil ─────────────────────────────────────────

const RISK_CONFIGS: Record<RiskProfile, RiskConfig> = {
  conservador: {
    emoji: '🛡️',
    color: '#10B981',
    label: 'Conservador',
    description: 'Priorizas la seguridad del capital sobre el rendimiento. Prefieres saber exactamente cuánto recibirás.',
    headline: 'Instrumentos seguros con rentabilidad estable',
    options: [
      {
        name: 'CDT (Certificado de Depósito a Término)',
        emoji: '🏦',
        returnRange: '8% – 13% EA',
        risk: 'Bajo',
        liquidity: 'Baja',
        minAmount: '$500.000',
        description: 'Depositas dinero en un banco por un plazo fijo (30 a 360 días) y recibes una tasa garantizada al vencimiento. Protegido por el Fogafin hasta $50 millones.',
        platforms: ['Bancolombia', 'Davivienda', 'BBVA', 'Banco de Bogotá'],
        tag: 'Recomendado',
      },
      {
        name: 'Fondos de Inversión a la Vista (FIC)',
        emoji: '📈',
        returnRange: '5% – 10% EA',
        risk: 'Bajo',
        liquidity: 'Alta',
        minAmount: '$50.000',
        description: 'Fondo colectivo que invierte en activos de bajo riesgo (deuda pública, repos). Puedes retirar en cualquier momento. Ideal para el fondo de emergencia que también genera rendimiento.',
        platforms: ['Fiduciaria Bancolombia', 'Alianza Fiduciaria', 'Credicorp Capital'],
        tag: 'Popular',
      },
      {
        name: 'Ahorro Programado Digital',
        emoji: '💚',
        returnRange: '3% – 7% EA',
        risk: 'Bajo',
        liquidity: 'Alta',
        minAmount: '$10.000',
        description: 'Bolsillos o alcancías automáticas en apps digitales. Rendimiento menor que un CDT pero con liquidez total y sin montos mínimos. El mejor punto de entrada para principiantes.',
        platforms: ['Nequi', 'Daviplata', 'RappiPay', 'Movii'],
      },
    ],
  },

  moderado: {
    emoji: '⚖️',
    color: '#F59E0B',
    label: 'Moderado',
    description: 'Buscas un equilibrio entre rendimiento y seguridad. Aceptas cierta volatilidad a cambio de mejor retorno a mediano plazo.',
    headline: 'Portafolio balanceado: renta fija + exposición a mercados',
    options: [
      {
        name: 'TES (Títulos de Deuda Pública)',
        emoji: '🏛️',
        returnRange: '10% – 15% EA',
        risk: 'Medio',
        liquidity: 'Media',
        minAmount: '$1.000.000',
        description: 'Bonos emitidos por el Gobierno colombiano. Alta seguridad (respaldados por el Estado) con rendimientos superiores a un CDT. Se pueden comprar en el mercado secundario a través de comisionistas.',
        platforms: ['Tyba', 'Deceval', 'Comisionistas BVC'],
        tag: 'Recomendado',
      },
      {
        name: 'Fondos de Inversión Balanceados',
        emoji: '🎯',
        returnRange: '8% – 14% EA',
        risk: 'Medio',
        liquidity: 'Media',
        minAmount: '$100.000',
        description: 'Fondos que combinan renta fija (60-70%) y renta variable (30-40%). La diversificación reduce el riesgo individual. Administrados por profesionales sin que tengas que elegir activos.',
        platforms: ['Porvenir FPV', 'Protección FPV', 'Skandia', 'Tyba'],
      },
      {
        name: 'ETFs Globales (renta mixta)',
        emoji: '🌍',
        returnRange: '7% – 14% EA histórico',
        risk: 'Medio-Alto',
        liquidity: 'Alta',
        minAmount: '$150.000',
        description: 'Fondos indexados que replican índices globales de bonos y acciones. Diversificación instantánea en miles de empresas del mundo. Requieren cuenta en plataforma de inversión.',
        platforms: ['Tyba', 'RappiInversiones', 'Nubank Inversiones'],
      },
    ],
  },

  arriesgado: {
    emoji: '📈',
    color: '#EF4444',
    label: 'Arriesgado',
    description: 'Buscas maximizar el retorno a largo plazo y aceptas volatilidad significativa en el camino. Tienes horizonte de inversión de 5+ años.',
    headline: 'Renta variable y activos de alto crecimiento',
    options: [
      {
        name: 'Acciones BVC (Bolsa de Valores de Colombia)',
        emoji: '📊',
        returnRange: 'Variable (histórico: 8% – 25% EA)',
        risk: 'Alto',
        liquidity: 'Alta',
        minAmount: '$200.000',
        description: 'Participación directa en empresas colombianas: Ecopetrol, Bancolombia, Grupo Argos. Requiere investigación y tolerancia a fluctuaciones. A largo plazo (10+ años) el mercado accionario ha superado la inflación consistentemente.',
        platforms: ['Tyba', 'Corredores Davivienda', 'Skandia', 'Casa de Bolsa'],
        tag: 'Largo plazo',
      },
      {
        name: 'ETFs de Renta Variable Global',
        emoji: '🚀',
        returnRange: '10% – 15% EA histórico (S&P 500)',
        risk: 'Alto',
        liquidity: 'Alta',
        minAmount: '$100.000',
        description: 'ETFs que replican el S&P 500 (500 mayores empresas de EE.UU.), Nasdaq 100 (tecnológicas) o índices globales. Forma eficiente de invertir en economías desarrolladas con diversificación automática.',
        platforms: ['Tyba', 'RappiInversiones', 'Nubank Inversiones'],
        tag: 'Recomendado',
      },
      {
        name: 'Aportes Voluntarios AFP (FPV)',
        emoji: '🏆',
        returnRange: '8% – 20% EA + beneficio tributario',
        risk: 'Medio-Alto',
        liquidity: 'Baja',
        minAmount: '$50.000',
        description: 'Aportes voluntarios a tu fondo de pensiones. Beneficio tributario: descuenta de renta hasta el 30% del ingreso. A largo plazo, es de los instrumentos con mejor relación riesgo-retorno disponibles en Colombia.',
        platforms: ['Porvenir', 'Protección', 'Skandia', 'Old Mutual'],
      },
    ],
  },
}

// ── Sub-componente: tarjeta de opción ─────────────────────────

function InvestmentCard({ option, accentColor }: { option: InvestmentOption; accentColor: string }) {
  const [expanded, setExpanded] = useState(false)

  const riskColors: Record<string, string> = {
    'Bajo':       Colors.green,
    'Medio':      Colors.yellow,
    'Medio-Alto': Colors.yellow,
    'Alto':       Colors.red,
  }
  const liquidityColors: Record<string, string> = {
    Alta:  Colors.green,
    Media: Colors.yellow,
    Baja:  Colors.red,
  }

  return (
    <div
      style={{
        backgroundColor: Colors.card,
        borderRadius: 16,
        border: `1.5px solid ${Colors.border}`,
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      }}
    >
      {/* Cabecera */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{option.emoji}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
                  {option.name}
                </p>
              </div>
              {option.tag && (
                <span
                  style={{
                    fontSize: 10, fontWeight: 700,
                    color: accentColor,
                    backgroundColor: `${accentColor}15`,
                    borderRadius: 9999, padding: '1px 6px',
                  }}
                >
                  {option.tag}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Métricas clave */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1, backgroundColor: Colors.primaryLight,
              borderRadius: 8, padding: '6px 10px', textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 10, color: Colors.textMuted, margin: '0 0 2px' }}>Rendimiento</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: Colors.primary, margin: 0 }}>
              {option.returnRange}
            </p>
          </div>
          <div
            style={{
              flex: 1, backgroundColor: `${riskColors[option.risk]}15`,
              borderRadius: 8, padding: '6px 10px', textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 10, color: Colors.textMuted, margin: '0 0 2px' }}>Riesgo</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: riskColors[option.risk], margin: 0 }}>
              {option.risk}
            </p>
          </div>
          <div
            style={{
              flex: 1, backgroundColor: `${liquidityColors[option.liquidity]}15`,
              borderRadius: 8, padding: '6px 10px', textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 10, color: Colors.textMuted, margin: '0 0 2px' }}>Liquidez</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: liquidityColors[option.liquidity], margin: 0 }}>
              {option.liquidity}
            </p>
          </div>
        </div>

        {/* Monto mínimo */}
        <p style={{ fontSize: 12, color: Colors.textMuted, margin: '8px 0 0' }}>
          💵 Desde <strong style={{ color: Colors.textPrimary }}>{option.minAmount}</strong>
        </p>
      </div>

      {/* Expandible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '10px 16px',
          backgroundColor: Colors.background,
          border: 'none', borderTop: `1px solid ${Colors.border}`,
          color: Colors.textSecondary, fontSize: 13,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{expanded ? 'Menos detalles' : 'Ver detalles'}</span>
        <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {expanded && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${Colors.border}` }}>
          <p style={{ fontSize: 13, color: Colors.textSecondary, margin: '0 0 12px', lineHeight: '19px' }}>
            {option.description}
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 6px' }}>
            Dónde encontrarlo:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {option.platforms.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 12,
                  backgroundColor: Colors.background,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: 6, padding: '3px 8px',
                  color: Colors.textSecondary,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function InversionesPage() {
  const navigate    = useNavigate()
  const { session } = useAuthStore()
  const { profile, loading } = useProfile(session?.user?.id)
  const [activeTab, setActiveTab] = useState<'perfil' | 'simulador'>('perfil')

  if (loading || !profile) {
    return <LoadingSpinner fullScreen message="Cargando tu perfil inversor…" />
  }

  const riskProfile = profile.risk_profile ?? 'conservador'
  const config      = RISK_CONFIGS[riskProfile]

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
          Perfil Inversor 📊
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', backgroundColor: Colors.card, borderBottom: `1px solid ${Colors.border}` }}>
        {([
          { key: 'perfil',    label: '📊 Mi perfil' },
          { key: 'simulador', label: '🚀 ETF vs Colchón' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1, padding: '14px 8px', border: 'none',
              backgroundColor: 'transparent', fontSize: 13,
              fontWeight: activeTab === key ? 700 : 500,
              color: activeTab === key ? Colors.primary : Colors.textMuted,
              borderBottom: activeTab === key ? `2px solid ${Colors.primary}` : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'simulador' ? (
        <div style={{ padding: '20px 16px 60px' }}>
          <p style={{ fontSize: 13, color: Colors.textSecondary, margin: '0 0 16px', lineHeight: '19px' }}>
            Descubre la diferencia real que hace invertir en lugar de guardar en efectivo. Ajusta los parámetros y ve crecer tu dinero.
          </p>
          <ETFSimulator />
        </div>
      ) : (
      <div style={{ padding: '20px 16px 60px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tarjeta de perfil de riesgo */}
        <div
          style={{
            backgroundColor: `${config.color}12`,
            borderRadius: 16, padding: 18,
            border: `1.5px solid ${config.color}40`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 36 }}>{config.emoji}</span>
            <div>
              <p style={{ fontSize: 12, color: Colors.textMuted, margin: '0 0 2px' }}>Tu perfil de riesgo</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: config.color, margin: 0, textTransform: 'capitalize' }}>
                {config.label}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: Colors.textSecondary, margin: 0, lineHeight: '20px' }}>
            {config.description}
          </p>
          <p style={{ fontSize: 11, color: Colors.textMuted, margin: '8px 0 0' }}>
            Definido en tu onboarding · Puedes actualizarlo en configuración
          </p>
        </div>

        {/* Descripción de la estrategia */}
        <div
          style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 12, padding: 14,
            border: `1px solid ${Colors.primaryA30}`,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 18 }}>💡</span>
          <p style={{ fontSize: 13, color: Colors.primary, margin: 0, lineHeight: '18px' }}>
            <strong>{config.headline}.</strong>{' '}
            Ordenados de menor a mayor nivel de riesgo, con opciones accesibles desde tu nivel de ingreso.
          </p>
        </div>

        {/* Opciones de inversión */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {config.options.map((opt) => (
            <InvestmentCard key={opt.name} option={opt} accentColor={config.color} />
          ))}
        </div>

        {/* Enlace a educación */}
        <button
          onClick={() => navigate('/educacion')}
          style={{
            width: '100%', height: 48,
            backgroundColor: Colors.card,
            border: `1.5px solid ${Colors.border}`,
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 16 }}>🎓</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>
            Aprender más sobre inversiones
          </span>
        </button>

        {/* ── DISCLAIMER REGULATORIO ──────────────────────── */}
        <div
          style={{
            backgroundColor: Colors.yellowLight,
            borderRadius: 14, padding: 16,
            border: `1px solid ${Colors.yellowA40}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.yellowDark, margin: '0 0 8px' }}>
            ⚠️ Aviso Legal Importante
          </p>
          <p style={{ fontSize: 12, color: Colors.textPrimary, margin: '0 0 8px', lineHeight: '18px' }}>
            <strong>FlowCheck no es una entidad financiera ni un asesor financiero regulado.</strong>{' '}
            La información presentada en esta pantalla tiene únicamente carácter educativo e informativo.
          </p>
          <p style={{ fontSize: 12, color: Colors.textSecondary, margin: '0 0 8px', lineHeight: '18px' }}>
            • Las rentabilidades históricas no garantizan resultados futuros.
          </p>
          <p style={{ fontSize: 12, color: Colors.textSecondary, margin: '0 0 8px', lineHeight: '18px' }}>
            • Toda inversión conlleva riesgos, incluyendo la posible pérdida del capital invertido.
          </p>
          <p style={{ fontSize: 12, color: Colors.textSecondary, margin: '0 0 8px', lineHeight: '18px' }}>
            • Antes de invertir, considera consultar con un asesor financiero certificado o una entidad vigilada por la Superintendencia Financiera de Colombia (SFC).
          </p>
          <p style={{ fontSize: 12, color: Colors.textSecondary, margin: 0, lineHeight: '18px' }}>
            • Las opciones presentadas son referenciadas con fines ilustrativos. FlowCheck no tiene relación comercial con ninguna de las plataformas mencionadas.
          </p>
        </div>

      </div>
      )}
    </div>
  )
}
