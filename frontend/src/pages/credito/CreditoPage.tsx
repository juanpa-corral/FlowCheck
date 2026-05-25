import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { useCreditScore, type FactorImpact } from '../../hooks/useCreditScore'
import { Colors } from '../../constants/theme'

// ── Constantes del módulo ─────────────────────────────────────

// UVT 2025 = $49.799
// 1.400 UVT ≈ $69.7M | 4.500 UVT ≈ $224M
const UVT_2025 = 49_799
const UVT_INCOME   = 1_400 * UVT_2025   // ~$69.7M
const UVT_HERITAGE = 4_500 * UVT_2025   // ~$224M

type AnswerLevel = 'low' | 'medium' | 'high'
type RentaResult = 'obligado' | 'posiblemente' | 'revisar' | 'no_obligado'
type ActiveTab   = 'score' | 'renta'

// ── Cuestionario de renta ─────────────────────────────────────

interface Question {
  id: string
  question: string
  subtitle: string
  options: { value: AnswerLevel; label: string; detail: string }[]
}

const QUESTIONS: Question[] = [
  {
    id: 'ingresos',
    question: '¿Cuánto recibiste en total durante 2025?',
    subtitle: 'Suma sueldos, honorarios, freelance, arriendos, becas con descuentos...',
    options: [
      { value: 'low',    label: 'Menos de $20 millones',  detail: 'Solo mesada, beca estudio o sueldo mínimo' },
      { value: 'medium', label: 'Entre $20M y $70M',      detail: 'Trabajo parcial, freelance moderado, etc.' },
      { value: 'high',   label: 'Más de $70 millones',    detail: 'Supera 1.400 UVT — umbral DIAN 2025' },
    ],
  },
  {
    id: 'patrimonio',
    question: '¿Cuánto valen tus bienes a 31 dic 2025?',
    subtitle: 'Suma propiedades, vehículos, inversiones, cuentas de ahorro y criptomonedas',
    options: [
      { value: 'low',    label: 'Menos de $50 millones',  detail: 'Sin bienes o bienes menores' },
      { value: 'medium', label: 'Entre $50M y $224M',     detail: 'Algunos bienes pero bajo 4.500 UVT' },
      { value: 'high',   label: 'Más de $224 millones',   detail: 'Supera 4.500 UVT — obliga a declarar' },
    ],
  },
  {
    id: 'tarjetas',
    question: '¿Cuánto gastaste con tarjetas en 2025?',
    subtitle: 'Crédito + débito. Tu banco puede darte el resumen anual',
    options: [
      { value: 'low',    label: 'Menos de $20 millones',  detail: 'Uso bajo o principalmente efectivo' },
      { value: 'medium', label: 'Entre $20M y $70M',      detail: 'Uso moderado de tarjetas' },
      { value: 'high',   label: 'Más de $70 millones',    detail: 'Supera 1.400 UVT — reportado a DIAN' },
    ],
  },
  {
    id: 'situacion',
    question: '¿Cómo describes tu situación fiscal?',
    subtitle: 'Esto no se reporta — es solo para la estimación',
    options: [
      { value: 'low',    label: 'Empleado o estudiante',            detail: 'Un solo empleador, sin actividad propia' },
      { value: 'medium', label: 'Independiente o freelance < $70M', detail: 'Facturas/honorarios, sin superar umbral' },
      { value: 'high',   label: 'RUT activo o ingresos > $70M',    detail: 'Actividad formal, responsable de IVA' },
    ],
  },
]

const DOCS_RENTA = [
  { emoji: '🏢', doc: 'Certificado de ingresos y retenciones',      who: 'Tu empleador o pagador' },
  { emoji: '🏦', doc: 'Extractos bancarios completos de 2025',      who: 'Tu banco o app financiera' },
  { emoji: '📈', doc: 'Certificado de inversiones (CDT, fondos)',   who: 'Entidad financiera' },
  { emoji: '🧾', doc: 'Relación de bienes y deudas a 31 dic',       who: 'Lo preparas tú mismo' },
  { emoji: '🪪', doc: 'RUT actualizado',                            who: 'DIAN — actualiza en dian.gov.co' },
  { emoji: '💊', doc: 'Facturas de salud (pueden ser deducibles)',   who: 'Guardadas durante el año' },
  { emoji: '🎓', doc: 'Certificado de aportes educativos',          who: 'Tu universidad o institución' },
  { emoji: '💼', doc: 'Certificados de aportes a pensión y salud',  who: 'AFP y EPS' },
]

// ── Lógica de resultado ───────────────────────────────────────

function calcRentaResult(answers: AnswerLevel[]): RentaResult {
  if (answers.some((a) => a === 'high'))                                  return 'obligado'
  if (answers.filter((a) => a === 'medium').length >= 2)                  return 'posiblemente'
  if (answers.filter((a) => a === 'medium').length === 1)                 return 'revisar'
  return 'no_obligado'
}

// ── Helpers de color e impacto ────────────────────────────────

const IMPACT_COLORS: Record<FactorImpact, string> = {
  excelente: Colors.green,
  bueno:     '#34D399',
  regular:   Colors.yellow,
  bajo:      Colors.red,
}

const IMPACT_LABELS: Record<FactorImpact, string> = {
  excelente: 'Excelente',
  bueno:     'Bueno',
  regular:   'Regular',
  bajo:      'Por mejorar',
}

// ── SUB-SECCIÓN: Score Crediticio ─────────────────────────────

function ScoreTab() {
  const { session }  = useAuthStore()
  const { profile }  = useProfile(session?.user?.id)
  const scoreResult  = useCreditScore(profile ?? null)
  const [animated, setAnimated] = useState(false)

  // Animación del número al montar
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (!scoreResult) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ color: Colors.textMuted }}>Cargando perfil…</p>
      </div>
    )
  }

  const { score, label, sublabel, color, emoji, factors, goodHabits, improvements } = scoreResult

  // Score como % del rango 150-950
  const scorePercent = ((score - 150) / (950 - 150)) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Gauge principal ── */}
      <div style={{ textAlign: 'center' }}>
        {/* Círculo donut con conic-gradient */}
        <div
          style={{
            width: 156, height: 156,
            borderRadius: '50%',
            background: `conic-gradient(
              ${color} ${scorePercent * 3.6}deg,
              ${Colors.border} ${scorePercent * 3.6}deg 360deg
            )`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            transition: 'background 1s ease',
          }}
        >
          <div
            style={{
              width: 112, height: 112,
              borderRadius: '50%',
              backgroundColor: Colors.card,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 20 }}>{emoji}</span>
            <p
              style={{
                fontSize: 34,
                fontWeight: 800,
                color,
                margin: 0,
                transition: 'all 1s ease',
                lineHeight: 1,
              }}
            >
              {animated ? score : 150}
            </p>
            <p style={{ fontSize: 10, color: Colors.textMuted, margin: 0 }}>/ 950</p>
          </div>
        </div>

        <p style={{ fontSize: 20, fontWeight: 800, color, margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: 13, color: Colors.textSecondary, margin: 0, lineHeight: '18px', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
          {sublabel}
        </p>

        {/* Escala de referencia */}
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 12 }}>
          {[
            { min: 150,  max: 349, label: '🌱', color: '#EF4444' },
            { min: 350,  max: 499, label: '🔨', color: '#F97316' },
            { min: 500,  max: 649, label: '📈', color: '#F59E0B' },
            { min: 650,  max: 799, label: '💪', color: '#34D399' },
            { min: 800,  max: 950, label: '🌟', color: '#10B981' },
          ].map((band) => (
            <div
              key={band.min}
              style={{
                height: 6,
                flex: 1,
                borderRadius: 3,
                backgroundColor: band.color,
                opacity: score >= band.min && score <= band.max ? 1 : 0.3,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontSize: 10, color: Colors.textMuted }}>150</span>
          <span style={{ fontSize: 10, color: Colors.textMuted }}>950</span>
        </div>
      </div>

      {/* Aviso educativo */}
      <div
        style={{
          backgroundColor: Colors.primaryLight,
          borderRadius: 10, padding: 12,
          border: `1px solid ${Colors.primaryA30}`,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 16 }}>🎓</span>
        <p style={{ fontSize: 12, color: Colors.primary, margin: 0, lineHeight: '17px' }}>
          <strong>Score FlowCheck — estimación educativa.</strong>{' '}
          Calculado a partir de tu perfil. No es un reporte real de DataCrédito ni de ninguna central de riesgo.
          Úsalo como espejo de tus hábitos.
        </p>
      </div>

      {/* ── Factores ── */}
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 10px' }}>
          📊 Factores del score
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {factors.map((f) => {
            const fPct   = ((f.factorScore - 150) / 800) * 100
            const fColor = IMPACT_COLORS[f.impact]
            return (
              <div
                key={f.id}
                style={{
                  backgroundColor: Colors.card,
                  borderRadius: 12, padding: 12,
                  border: `1.5px solid ${Colors.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 16 }}>{f.emoji}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>{f.label}</p>
                      <p style={{ fontSize: 11, color: Colors.textMuted, margin: 0 }}>{f.currentValue} · peso {Math.round(f.weight * 100)}%</p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700,
                      color: fColor,
                      backgroundColor: `${fColor}15`,
                      borderRadius: 9999, padding: '2px 8px',
                    }}
                  >
                    {IMPACT_LABELS[f.impact]}
                  </span>
                </div>

                {/* Barra del factor */}
                <div style={{ height: 6, backgroundColor: Colors.border, borderRadius: 9999, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${fPct}%`,
                      backgroundColor: fColor,
                      borderRadius: 9999,
                      transition: 'width 1s ease',
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: Colors.textSecondary, margin: '4px 0 0', lineHeight: '15px' }}>
                  {f.interpretation}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Buenos hábitos ── */}
      {goodHabits.length > 0 && (
        <div
          style={{
            backgroundColor: Colors.greenLight,
            borderRadius: 14, padding: 14,
            border: `1px solid ${Colors.greenA30}`,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, color: Colors.green, margin: '0 0 10px' }}>
            ✅ Hábitos que te suman
          </p>
          {goodHabits.map((h) => (
            <div key={h} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
              <span style={{ color: Colors.green, fontSize: 14, flexShrink: 0, marginTop: 1 }}>•</span>
              <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '18px' }}>{h}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Oportunidades de mejora ── */}
      {improvements.length > 0 && (
        <div
          style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 14, padding: 14,
            border: `1px solid ${Colors.primaryA30}`,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, color: Colors.primary, margin: '0 0 10px' }}>
            🚀 Oportunidades de mejora
          </p>
          {improvements.map((imp) => (
            <div
              key={imp.text}
              style={{
                backgroundColor: Colors.card,
                borderRadius: 10, padding: 10, marginBottom: 8,
              }}
            >
              <p style={{ fontSize: 13, color: Colors.textPrimary, margin: '0 0 3px', lineHeight: '18px' }}>
                {imp.text}
              </p>
              <p style={{ fontSize: 11, color: Colors.primary, fontWeight: 700, margin: 0 }}>
                {imp.impact}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

// ── SUB-SECCIÓN: Declaración de Renta ────────────────────────

function RentaTab() {
  const [step,    setStep]    = useState<number>(-1)         // -1 = intro
  const [answers, setAnswers] = useState<AnswerLevel[]>([])

  const result: RentaResult | null = answers.length === QUESTIONS.length
    ? calcRentaResult(answers)
    : null

  const handleAnswer = (val: AnswerLevel) => {
    const next = [...answers, val]
    setAnswers(next)
    if (next.length < QUESTIONS.length) setStep(step + 1)
    // else result se calcula automáticamente
  }

  const reset = () => { setAnswers([]); setStep(-1) }

  // ── Intro
  if (step === -1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <p style={{ fontSize: 44, margin: '0 0 12px' }}>📋</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: Colors.textPrimary, margin: '0 0 6px' }}>
            Calculadora de Renta 2025
          </p>
          <p style={{ fontSize: 13, color: Colors.textSecondary, margin: 0, lineHeight: '19px' }}>
            4 preguntas simples para saber si posiblemente debes declarar renta este año. No necesitas ser contador.
          </p>
        </div>

        <div
          style={{
            backgroundColor: Colors.greenLight,
            borderRadius: 12, padding: 14,
            border: `1px solid ${Colors.greenA30}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.green, margin: '0 0 6px' }}>
            ✅ Lo que esta calculadora SÍ hace
          </p>
          <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px' }}>
            Te da una estimación rápida y educativa sobre si posiblemente debes presentar declaración de renta ante la DIAN para el año gravable 2025.
          </p>
        </div>

        <div
          style={{
            backgroundColor: Colors.yellowLight,
            borderRadius: 12, padding: 14,
            border: `1px solid ${Colors.yellowA40}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.yellowDark, margin: '0 0 6px' }}>
            ⚠️ Lo que esta calculadora NO hace
          </p>
          <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px' }}>
            No reemplaza la asesoría de un contador público. La legislación tributaria cambia anualmente. Ante cualquier duda, consulta un profesional.
          </p>
        </div>

        <div
          style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 12, padding: 14,
            border: `1px solid ${Colors.primaryA30}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.primary, margin: '0 0 4px' }}>
            📅 Año gravable 2025 — UVT vigente
          </p>
          <p style={{ fontSize: 12, color: Colors.textSecondary, margin: 0, lineHeight: '18px' }}>
            Umbral de ingresos y consumos: <strong>${UVT_INCOME.toLocaleString('es-CO')}</strong> (1.400 UVT){'\n'}
            Umbral de patrimonio: <strong>${UVT_HERITAGE.toLocaleString('es-CO')}</strong> (4.500 UVT)
          </p>
        </div>

        <button
          onClick={() => setStep(0)}
          style={{
            width: '100%', height: 52,
            backgroundColor: Colors.primary, color: Colors.white,
            borderRadius: 12, border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Comenzar cuestionario →
        </button>
      </div>
    )
  }

  // ── Cuestionario activo
  if (result === null) {
    const q        = QUESTIONS[step]
    const progress = ((step) / QUESTIONS.length) * 100

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Progreso */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: Colors.textMuted }}>Pregunta {step + 1} de {QUESTIONS.length}</span>
            <span style={{ fontSize: 12, color: Colors.primary, fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 6, backgroundColor: Colors.border, borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: Colors.primary,
                borderRadius: 9999,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: Colors.textPrimary, margin: '0 0 6px', lineHeight: '24px' }}>
            {q.question}
          </p>
          <p style={{ fontSize: 13, color: Colors.textSecondary, margin: 0, lineHeight: '18px' }}>
            {q.subtitle}
          </p>
        </div>

        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: Colors.card,
                border: `1.5px solid ${Colors.border}`,
                borderRadius: 14, cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12,
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = Colors.primary
                el.style.backgroundColor = Colors.primaryLight
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = Colors.border
                el.style.backgroundColor = Colors.card
              }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0 }}>
                  {opt.detail}
                </p>
              </div>
              <span style={{ color: Colors.textMuted, fontSize: 18, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => { setStep(Math.max(0, step - 1)); setAnswers(answers.slice(0, -1)) }}
          style={{
            background: 'none', border: 'none',
            color: Colors.textMuted, fontSize: 13,
            cursor: step > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', opacity: step > 0 ? 1 : 0.4,
          }}
          disabled={step === 0}
        >
          ← Pregunta anterior
        </button>
      </div>
    )
  }

  // ── Resultado
  const resultConfig = {
    obligado: {
      emoji: '📋',
      color: Colors.red,
      bgColor: Colors.redLight,
      title: 'Probablemente debes declarar',
      subtitle: 'Según tus respuestas, una o más condiciones superan los umbrales de la DIAN para el año gravable 2025. Declarar a tiempo evita sanciones.',
      showDocs: true,
    },
    posiblemente: {
      emoji: '🔍',
      color: Colors.yellow,
      bgColor: Colors.yellowLight,
      title: 'Posiblemente obligado',
      subtitle: 'Tienes varios factores en zona media. Es recomendable consultar con un contador para confirmar tu situación antes del plazo límite.',
      showDocs: true,
    },
    revisar: {
      emoji: '🤔',
      color: Colors.yellow,
      bgColor: Colors.yellowLight,
      title: 'Vale la pena revisar',
      subtitle: 'Una condición está en el límite. Probablemente no estés obligado, pero una revisión rápida con un contador te dará tranquilidad total.',
      showDocs: false,
    },
    no_obligado: {
      emoji: '✅',
      color: Colors.green,
      bgColor: Colors.greenLight,
      title: 'Probablemente no obligado',
      subtitle: '¡Tranquilidad! Según tus respuestas, no superas ningún umbral de obligación. De todas formas, guarda todos tus documentos por si acaso.',
      showDocs: false,
    },
  }

  const cfg = resultConfig[result]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Resultado principal */}
      <div
        style={{
          backgroundColor: cfg.bgColor,
          borderRadius: 16, padding: 20,
          border: `1.5px solid ${cfg.color}40`,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 44, margin: '0 0 10px' }}>{cfg.emoji}</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: cfg.color, margin: '0 0 8px' }}>
          {cfg.title}
        </p>
        <p style={{ fontSize: 14, color: Colors.textPrimary, margin: 0, lineHeight: '20px' }}>
          {cfg.subtitle}
        </p>
      </div>

      {/* Resumen de respuestas */}
      <div
        style={{
          backgroundColor: Colors.card,
          borderRadius: 12, padding: 14,
          border: `1px solid ${Colors.border}`,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: Colors.textSecondary, margin: '0 0 10px' }}>
          Tus respuestas
        </p>
        {QUESTIONS.map((q, i) => {
          const ans = answers[i]
          const opt = q.options.find((o) => o.value === ans)!
          const dotColor = ans === 'high' ? Colors.red : ans === 'medium' ? Colors.yellow : Colors.green
          return (
            <div key={q.id} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: dotColor, flexShrink: 0, marginTop: 4,
                }}
              />
              <div>
                <p style={{ fontSize: 12, color: Colors.textMuted, margin: '0 0 1px' }}>{q.question}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, margin: 0 }}>{opt.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Documentos a reunir (si aplica) */}
      {cfg.showDocs && (
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 10px' }}>
            📁 Documentos que necesitarás
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DOCS_RENTA.map((item) => (
              <div
                key={item.doc}
                style={{
                  backgroundColor: Colors.card,
                  borderRadius: 12, padding: 12,
                  border: `1px solid ${Colors.border}`,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, margin: '0 0 2px' }}>
                    {item.doc}
                  </p>
                  <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0 }}>
                    {item.who}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plazos importantes */}
      {cfg.showDocs && (
        <div
          style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 12, padding: 14,
            border: `1px solid ${Colors.primaryA30}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.primary, margin: '0 0 6px' }}>
            📅 Fechas clave 2026 (declaración 2025)
          </p>
          <p style={{ fontSize: 13, color: Colors.textSecondary, margin: '0 0 4px', lineHeight: '18px' }}>
            • Los plazos varían según el NIT/cédula — consulta el calendario tributario en <strong>dian.gov.co</strong>
          </p>
          <p style={{ fontSize: 13, color: Colors.textSecondary, margin: 0, lineHeight: '18px' }}>
            • La declaración de renta de personas naturales se presenta entre agosto y octubre de 2026
          </p>
        </div>
      )}

      {/* Tip positivo para no obligados */}
      {!cfg.showDocs && result !== 'no_obligado' && (
        <div
          style={{
            backgroundColor: Colors.yellowLight,
            borderRadius: 12, padding: 14,
            border: `1px solid ${Colors.yellowA40}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.yellowDark, margin: '0 0 6px' }}>
            💡 Consejo preventivo
          </p>
          <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px' }}>
            Guarda todos tus extractos, recibos de pago y certificados durante al menos 5 años.
            La DIAN puede revisar períodos anteriores.
          </p>
        </div>
      )}

      {result === 'no_obligado' && (
        <div
          style={{
            backgroundColor: Colors.greenLight,
            borderRadius: 12, padding: 14,
            border: `1px solid ${Colors.greenA30}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.green, margin: '0 0 6px' }}>
            💡 Aunque no declares, puedes hacer esto
          </p>
          <p style={{ fontSize: 13, color: Colors.textPrimary, margin: 0, lineHeight: '19px' }}>
            Puedes presentar declaración de renta voluntariamente si tienes saldos a favor de retención en la fuente.
            En ese caso, la DIAN te devuelve lo retenido de más. ¡Consulta si aplica para ti!
          </p>
        </div>
      )}

      {/* DISCLAIMER OBLIGATORIO */}
      <div
        style={{
          backgroundColor: Colors.background,
          borderRadius: 12, padding: 14,
          border: `1px dashed ${Colors.border}`,
        }}
      >
        <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0, lineHeight: '18px', textAlign: 'center' }}>
          ⚠️ <strong>Esta es una guía educativa, no asesoría tributaria.</strong>{' '}
          FlowCheck no es un contador ni una firma tributaria. Ante cualquier duda, consulta a un Contador Público Titulado.
          Las reglas tributarias cambian anualmente.
        </p>
      </div>

      {/* Volver a hacer el cuestionario */}
      <button
        onClick={reset}
        style={{
          width: '100%', height: 44,
          backgroundColor: 'transparent',
          border: `1.5px solid ${Colors.border}`,
          borderRadius: 12, cursor: 'pointer',
          color: Colors.textSecondary, fontSize: 14,
          fontFamily: 'inherit',
        }}
      >
        🔄 Volver a calcular
      </button>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function CreditoPage() {
  const navigate   = useNavigate()
  const [tab, setTab] = useState<ActiveTab>('score')

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
          Salud Crediticia 🏦
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: Colors.card,
          borderBottom: `1px solid ${Colors.border}`,
        }}
      >
        {([
          { key: 'score', label: '📊 Score Crediticio' },
          { key: 'renta', label: '📋 Declaración de Renta' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '14px 8px',
              border: 'none', backgroundColor: 'transparent',
              fontSize: 13,
              fontWeight: tab === key ? 700 : 500,
              color: tab === key ? Colors.primary : Colors.textMuted,
              borderBottom: tab === key ? `2px solid ${Colors.primary}` : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ padding: '20px 16px 60px' }}>
        {tab === 'score' ? <ScoreTab /> : <RentaTab />}
      </div>
    </div>
  )
}
