import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Sun, Moon, ArrowLeft, Bell } from 'lucide-react'
import { Colors } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'

// ── Tipos ─────────────────────────────────────────────────────

interface TopBarProps {
  title?: string          // si está vacío, muestra el logo "FlowCheck"
  showBack?: boolean      // muestra ← en lugar del hamburger
  onMenuOpen?: () => void
}

// ── Componente ────────────────────────────────────────────────

export function TopBar({ title = '', showBack = false, onMenuOpen }: TopBarProps) {
  const navigate     = useNavigate()
  const { isDark, toggle } = useTheme()

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 480,
        width: '100%',
        height: 60,
        backgroundColor: Colors.card,
        borderBottom: `1px solid ${Colors.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Izquierda: Hamburger o Atrás ── */}
      <button
        onClick={showBack ? () => navigate(-1) : onMenuOpen}
        style={{
          width: 40, height: 40,
          borderRadius: 12,
          border: 'none',
          background: Colors.primaryLight,
          color: Colors.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
        aria-label={showBack ? 'Volver' : 'Menú'}
      >
        {showBack
          ? <ArrowLeft size={18} strokeWidth={2.5} />
          : <Menu size={18} strokeWidth={2.5} />
        }
      </button>

      {/* ── Centro: Logo o título ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {title ? (
          <p style={{
            fontSize: 16,
            fontWeight: 700,
            color: Colors.textPrimary,
            margin: 0,
          }}>
            {title}
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>💚</span>
            <p style={{
              fontSize: 17,
              fontWeight: 800,
              color: Colors.primary,
              margin: 0,
              letterSpacing: '-0.3px',
            }}>
              FlowCheck
            </p>
          </div>
        )}
      </div>

      {/* ── Derecha: Dark mode toggle ── */}
      <button
        onClick={toggle}
        style={{
          width: 40, height: 40,
          borderRadius: 12,
          border: 'none',
          background: Colors.primaryLight,
          color: Colors.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
        aria-label="Cambiar tema"
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark
          ? <Sun size={17} strokeWidth={2.5} />
          : <Moon size={17} strokeWidth={2.5} />
        }
      </button>
    </header>
  )
}
