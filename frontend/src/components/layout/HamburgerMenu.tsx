import React from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Wallet, TrendingUp, ShoppingBag, CreditCard, LogOut, ChevronRight, Award } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Colors, Radius, Font } from '../../constants/theme'
import { getLevelInfo } from '../../hooks/usePoints'

// ── Tipos ─────────────────────────────────────────────────────

interface HamburgerMenuProps {
  open: boolean
  onClose: () => void
  userName?: string
  totalPoints?: number
}

// ── Items del menú ────────────────────────────────────────────

const MENU_ITEMS = [
  { icon: Wallet,      label: 'Cuentas & Bolsillos', sub: 'Saldos y patrimonio',  path: '/cuentas'      },
  { icon: TrendingUp,  label: 'Inversiones',          sub: 'Según tu perfil',      path: '/inversiones'  },
  { icon: ShoppingBag, label: 'Marketplace',           sub: 'Canjea tus puntos',    path: '/marketplace'  },
  { icon: CreditCard,  label: 'Crédito & Renta',      sub: 'Score y declaración',  path: '/credito'      },
] as const

// ── Componente ────────────────────────────────────────────────

export function HamburgerMenu({ open, onClose, userName = '', totalPoints = 0 }: HamburgerMenuProps) {
  const navigate       = useNavigate()
  const { signOut }    = useAuthStore()
  const levelInfo      = getLevelInfo(totalPoints)

  const handleNav = (path: string) => {
    onClose()
    navigate(path)
  }

  const handleSignOut = async () => {
    onClose()
    if (window.confirm('¿Seguro que quieres cerrar sesión?')) {
      await signOut()
      navigate('/login', { replace: true })
    }
  }

  return createPortal(
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ── Drawer ── */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          // Se alinea al borde izquierdo del phone-shell centrado en escritorio.
          // En móvil (viewport < 480px) queda en left: 0.
          left: 'max(0px, calc(50vw - 240px))',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          maxWidth: 320,
          width: '82%',
          height: '100dvh',
          backgroundColor: Colors.card,
          boxShadow: '4px 0 32px rgba(0,0,0,0.15)',
          zIndex: 9001,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.06, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* ── Header del drawer ── */}
        <div
          style={{
            padding: '20px 20px 0',
            borderBottom: `1px solid ${Colors.border}`,
            paddingBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>💚</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: Colors.primary }}>FlowCheck</span>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: 'none', background: Colors.primaryLight,
                color: Colors.primary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Perfil del usuario ── */}
          {userName && (
            <div
              style={{
                backgroundColor: Colors.background,
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
                  {userName.split(' ')[0]}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Award size={11} color={Colors.primary} />
                  <p style={{ fontSize: 11, color: Colors.primary, margin: 0, fontWeight: 600 }}>
                    {levelInfo.emoji} {levelInfo.name} · {totalPoints.toLocaleString('es-CO')} pts
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Ítems del menú ── */}
        <div style={{ padding: '12px 12px 0', flex: 1 }}>
          {MENU_ITEMS.map(({ icon: Icon, label, sub, path }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 10px',
                borderRadius: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = Colors.primaryLight }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: 11,
                  backgroundColor: Colors.primaryLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} strokeWidth={2} color={Colors.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: Colors.textMuted, margin: 0 }}>{sub}</p>
              </div>
              <ChevronRight size={14} color={Colors.textMuted} />
            </button>
          ))}
        </div>

        {/* ── Footer: Cerrar sesión ── */}
        <div style={{ padding: '16px 12px 32px', borderTop: `1px solid ${Colors.border}` }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 10px',
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 40, height: 40, borderRadius: 11,
                backgroundColor: Colors.redLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LogOut size={18} strokeWidth={2} color={Colors.red} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: Colors.red, margin: 0 }}>
              Cerrar sesión
            </p>
          </button>
        </div>
      </aside>
    </>,
    document.body,
  )
}
