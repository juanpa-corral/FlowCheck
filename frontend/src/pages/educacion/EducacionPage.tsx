import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { useLessons } from '../../hooks/useLessons'
import { LessonCard } from '../../components/LessonCard'
import { CompoundInterestSimulator } from '../../components/CompoundInterestSimulator'
import { Colors } from '../../constants/theme'
import type { Lesson } from '../../data/lessons'

// ── Vista detalle de lección ──────────────────────────────────

interface LessonDetailProps {
  lesson: Lesson
  onBack: () => void
}

function LessonDetail({ lesson, onBack }: LessonDetailProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          backgroundColor: Colors.card,
          borderBottom: `1px solid ${Colors.border}`,
          position: 'sticky', top: 0, zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: Colors.textPrimary }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: 11, fontWeight: 700,
              color: lesson.tagColor,
              backgroundColor: `${lesson.tagColor}15`,
              borderRadius: 9999, padding: '2px 8px',
            }}
          >
            {lesson.tag}
          </span>
        </div>
        <span style={{ fontSize: 12, color: Colors.textMuted }}>{lesson.readTime} min</span>
      </div>

      <div style={{ padding: '24px 20px 48px' }}>
        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 44, margin: '0 0 12px' }}>{lesson.emoji}</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: Colors.textPrimary, margin: 0, lineHeight: '28px' }}>
            {lesson.title}
          </h1>
        </div>

        {/* Resumen destacado */}
        <div
          style={{
            backgroundColor: `${lesson.tagColor}12`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 24,
            borderLeft: `3px solid ${lesson.tagColor}`,
          }}
        >
          <p style={{ fontSize: 14, color: Colors.textPrimary, margin: 0, lineHeight: '20px', fontStyle: 'italic' }}>
            {lesson.summary}
          </p>
        </div>

        {/* Secciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {lesson.sections.map((section, idx) => (
            <div key={idx}>
              {section.heading && (
                <p style={{ fontSize: 15, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 6px' }}>
                  {section.heading}
                </p>
              )}
              <p style={{ fontSize: 14, color: Colors.textSecondary, margin: 0, lineHeight: '22px' }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Consejo accionable */}
        <div
          style={{
            backgroundColor: Colors.greenLight,
            borderRadius: 14,
            padding: 16,
            marginTop: 28,
            border: `1px solid ${Colors.greenA40}`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: Colors.green, margin: '0 0 6px' }}>
            💡 Consejo accionable
          </p>
          <p style={{ fontSize: 14, color: Colors.textPrimary, margin: 0, lineHeight: '20px' }}>
            {lesson.tip}
          </p>
        </div>

        {/* Si la lección es sobre interés compuesto, mostrar el simulador */}
        {lesson.id === 'interes-compuesto' && (
          <div style={{ marginTop: 28 }}>
            <CompoundInterestSimulator />
          </div>
        )}

        {/* Botón volver */}
        <button
          onClick={onBack}
          style={{
            width: '100%', height: 52,
            backgroundColor: Colors.primary, color: Colors.white,
            borderRadius: 12, border: 'none',
            fontSize: 15, fontWeight: 700,
            cursor: 'pointer', marginTop: 28,
            fontFamily: 'inherit',
          }}
        >
          ← Volver a Educación
        </button>
      </div>
    </div>
  )
}

// ── Página principal de Educación ─────────────────────────────

export default function EducacionPage() {
  const navigate           = useNavigate()
  const { session }        = useAuthStore()
  const { profile }        = useProfile(session?.user?.id)
  const { contextualLessons, allLessons } = useLessons(profile ?? null)

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [activeTab,    setActiveTab]    = useState<'para-ti' | 'todas' | 'simulador'>('para-ti')

  // Vista detalle
  if (activeLesson) {
    return <LessonDetail lesson={activeLesson} onBack={() => setActiveLesson(null)} />
  }

  // Lecciones que no están en las contextuales (para "Todas")
  const remainingLessons = allLessons.filter(
    (l) => !contextualLessons.find((c) => c.id === l.id),
  )

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
          Educación Financiera 🎓
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: Colors.card,
          borderBottom: `1px solid ${Colors.border}`,
          padding: '0 16px',
        }}
      >
        {([
          { key: 'para-ti',   label: '⚡ Para ti' },
          { key: 'todas',     label: '📚 Todas' },
          { key: 'simulador', label: '🧮 Simulador' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              padding: '14px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 13,
              fontWeight: activeTab === key ? 700 : 500,
              color: activeTab === key ? Colors.primary : Colors.textMuted,
              borderBottom: activeTab === key ? `2px solid ${Colors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 16px 48px' }}>

        {/* ── TAB: Para ti ─────────────────────────────────── */}
        {activeTab === 'para-ti' && (
          <>
            {contextualLessons.length > 0 ? (
              <>
                <div
                  style={{
                    backgroundColor: Colors.primaryLight,
                    borderRadius: 12, padding: 12, marginBottom: 16,
                    border: `1px solid ${Colors.primaryA30}`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <p style={{ fontSize: 13, color: Colors.primary, margin: 0, lineHeight: '18px' }}>
                    <strong>Lecciones seleccionadas para tu situación actual.</strong>{' '}
                    FlowCheck analizó tu perfil y eligió los temas más relevantes para ti ahora mismo.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {contextualLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      onClick={setActiveLesson}
                      highlight={lesson.priority === 1}
                    />
                  ))}
                </div>

                <p style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', margin: '16px 0 0' }}>
                  ¿Quieres más? Ve a la pestaña "Todas" 👆
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🌟</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: Colors.textPrimary, margin: '0 0 8px' }}>
                  ¡Tu situación financiera se ve bien!
                </p>
                <p style={{ fontSize: 14, color: Colors.textMuted }}>
                  No hay lecciones urgentes. Explora el catálogo completo.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Todas ────────────────────────────────────── */}
        {activeTab === 'todas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contextualLessons.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: Colors.textSecondary, margin: '0 0 6px' }}>
                  ⚡ Recomendadas para ti
                </p>
                {contextualLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onClick={setActiveLesson}
                    highlight
                  />
                ))}
                {remainingLessons.length > 0 && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: Colors.textSecondary, margin: '10px 0 6px' }}>
                    📖 Catálogo completo
                  </p>
                )}
              </>
            )}

            {remainingLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onClick={setActiveLesson}
              />
            ))}
          </div>
        )}

        {/* ── TAB: Simulador ────────────────────────────────── */}
        {activeTab === 'simulador' && (
          <>
            <p style={{ fontSize: 13, color: Colors.textSecondary, margin: '0 0 16px', lineHeight: '19px' }}>
              Descubre cómo tus ahorros mensuales crecen con el paso del tiempo gracias al interés compuesto.
              Mueve los controles y experimenta con distintos escenarios.
            </p>
            <CompoundInterestSimulator />

            {/* Tips del simulador */}
            <div
              style={{
                backgroundColor: Colors.yellowLight,
                borderRadius: 12, padding: 14, marginTop: 16,
                border: `1px solid ${Colors.yellowA40}`,
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: Colors.yellowDark, margin: '0 0 8px' }}>
                💡 Qué observar en el simulador
              </p>
              {[
                'Aumenta los años: el crecimiento se acelera exponencialmente.',
                'Sube la tasa 2 puntos: la diferencia final puede ser millones.',
                'Compara $100k/mes durante 30 años vs $500k/mes durante 10 años.',
              ].map((tip) => (
                <p key={tip} style={{ fontSize: 13, color: Colors.textPrimary, margin: '0 0 5px', lineHeight: '18px' }}>
                  • {tip}
                </p>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
