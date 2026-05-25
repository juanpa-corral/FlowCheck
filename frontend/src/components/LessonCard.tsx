import React from 'react'
import { Colors } from '../constants/theme'
import type { Lesson } from '../data/lessons'

interface LessonCardProps {
  lesson: Lesson
  onClick: (lesson: Lesson) => void
  /** true → borde de color según la urgencia de la lección */
  highlight?: boolean
}

export function LessonCard({ lesson, onClick, highlight = false }: LessonCardProps) {
  return (
    <button
      onClick={() => onClick(lesson)}
      style={{
        width: '100%',
        backgroundColor: Colors.card,
        borderRadius: 14,
        padding: 14,
        border: highlight
          ? `1.5px solid ${lesson.tagColor}50`
          : `1.5px solid ${Colors.border}`,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        fontFamily: 'inherit',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Emoji */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${lesson.tagColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {lesson.emoji}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Tag + tiempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: lesson.tagColor,
              backgroundColor: `${lesson.tagColor}15`,
              borderRadius: 9999,
              padding: '2px 7px',
            }}
          >
            {lesson.tag}
          </span>
          <span style={{ fontSize: 11, color: Colors.textMuted }}>
            {lesson.readTime} min lectura
          </span>
        </div>

        {/* Título */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: Colors.textPrimary,
            margin: '0 0 3px',
            lineHeight: '17px',
          }}
        >
          {lesson.title}
        </p>

        {/* Resumen */}
        <p
          style={{
            fontSize: 12,
            color: Colors.textSecondary,
            margin: 0,
            lineHeight: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {lesson.summary}
        </p>
      </div>

      {/* Flecha */}
      <span style={{ color: Colors.textMuted, fontSize: 16, flexShrink: 0, marginTop: 2 }}>›</span>
    </button>
  )
}
