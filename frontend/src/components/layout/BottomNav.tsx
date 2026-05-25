import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BarChart2, GraduationCap, User, Plus, type LucideIcon } from 'lucide-react'
import { Colors } from '../../constants/theme'

// ── Configuración de tabs ─────────────────────────────────────

interface TabConfig {
  path: string
  icon: LucideIcon
  label: string
}

const TABS: TabConfig[] = [
  { path: '/dashboard',  icon: Home,          label: 'Inicio'    },
  { path: '/analitica',  icon: BarChart2,      label: 'Analítica' },
  { path: '/educacion',  icon: GraduationCap,  label: 'Educación' },
  { path: '/credito',    icon: User,           label: 'Perfil'    },
]

// ── Tipos ─────────────────────────────────────────────────────

interface BottomNavProps {
  onFabPress: () => void
}

// ── Componente ────────────────────────────────────────────────

export function BottomNav({ onFabPress }: BottomNavProps) {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left:  '50%',
        transform: 'translateX(-50%)',
        maxWidth: 480,
        width:  '100%',
        height: 72,
        background: 'var(--c-glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid var(--c-glass-border)`,
        boxShadow: 'var(--c-glass-shadow)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ── Distribución: 2 tabs | FAB | 2 tabs ── */}
      {TABS.slice(0, 2).map((tab) => (
        <TabButton
          key={tab.path}
          tab={tab}
          active={pathname === tab.path || pathname.startsWith(tab.path + '/')}
          onClick={() => navigate(tab.path)}
        />
      ))}

      {/* ── FAB central ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={onFabPress}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%)`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 16px var(--c-primary-a40), 0 2px 8px rgba(0,0,0,0.15)`,
            transform: 'translateY(-14px)',  // sobresale sobre la barra
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            flexShrink: 0,
          }}
          aria-label="Registrar movimiento"
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-12px) scale(0.95)' }}
          onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-14px)' }}
          onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-12px) scale(0.95)' }}
          onTouchEnd={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-14px)' }}
        >
          <Plus size={24} strokeWidth={3} color="#FFFFFF" />
        </button>
      </div>

      {TABS.slice(2).map((tab) => (
        <TabButton
          key={tab.path}
          tab={tab}
          active={pathname === tab.path || pathname.startsWith(tab.path + '/')}
          onClick={() => navigate(tab.path)}
        />
      ))}
    </nav>
  )
}

// ── Sub-componente de tab ─────────────────────────────────────

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: TabConfig
  active: boolean
  onClick: () => void
}) {
  const Icon = tab.icon
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: '100%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        padding: 0,
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      {/* Indicador activo */}
      {active && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: Colors.primary,
          }}
        />
      )}

      <Icon
        size={22}
        strokeWidth={active ? 2.5 : 1.8}
        style={{ color: active ? Colors.primary : Colors.textMuted }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: active ? 700 : 500,
          color: active ? Colors.primary : Colors.textMuted,
          lineHeight: 1,
        }}
      >
        {tab.label}
      </span>
    </button>
  )
}
