import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { HamburgerMenu } from './HamburgerMenu'
import { FABSheet } from './FABSheet'
import { Colors } from '../../constants/theme'

// ── Contexto de layout (para abrir drawers desde cualquier componente) ──

interface LayoutCtx {
  openMenu: () => void
  openFab:  () => void
  closeMenu: () => void
  closeFab:  () => void
}

const LayoutContext = createContext<LayoutCtx>({
  openMenu: () => {}, openFab: () => {},
  closeMenu: () => {}, closeFab: () => {},
})

export const useLayout = () => useContext(LayoutContext)

// ── Rutas que muestran el TopBar con hamburger ────────────────

const MAIN_TAB_ROUTES = ['/dashboard', '/analitica', '/educacion', '/credito']

// ── Título por ruta para páginas secundarias ──────────────────

const ROUTE_TITLE: Record<string, string> = {
  '/inversiones': 'Inversiones',
  '/cuentas':     'Cuentas & Bolsillos',
  '/marketplace': 'Marketplace',
  '/registrar':   'Nuevo movimiento',
}

// ── Componente ────────────────────────────────────────────────

interface MobileLayoutProps {
  children: ReactNode
  userName?:    string
  totalPoints?: number
}

export function MobileLayout({ children, userName = '', totalPoints = 0 }: MobileLayoutProps) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [fabOpen,  setFabOpen]  = useState(false)

  const isMainTab = MAIN_TAB_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const isInner   = !isMainTab && pathname !== '/login' && !pathname.startsWith('/onboarding')
  const showTopBar = isMainTab || isInner

  const pageTitle = ROUTE_TITLE[pathname] ?? ''

  return (
    <LayoutContext.Provider value={{
      openMenu:  () => setMenuOpen(true),
      openFab:   () => setFabOpen(true),
      closeMenu: () => setMenuOpen(false),
      closeFab:  () => setFabOpen(false),
    }}>
      <div
        id="phone-shell"
        style={{
          position: 'relative',
          minHeight: '100dvh',
          backgroundColor: Colors.background,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Top Bar ── */}
        {showTopBar && (
          <TopBar
            title={isMainTab ? '' : pageTitle}
            showBack={isInner}
            onMenuOpen={() => setMenuOpen(true)}
          />
        )}

        {/* ── Contenido (padding para TopBar y BottomNav) ── */}
        <main
          style={{
            flex: 1,
            paddingTop: showTopBar ? 60 : 0,
            paddingBottom: 88,
            overflowY: 'auto',
          }}
        >
          {children}
        </main>

        {/* ── Bottom Nav (siempre visible en páginas auth) ── */}
        {showTopBar && (
          <BottomNav onFabPress={() => setFabOpen(true)} />
        )}

        {/* ── Hamburger Drawer ── */}
        <HamburgerMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          userName={userName}
          totalPoints={totalPoints}
        />

        {/* ── FAB Quick-Register Sheet ── */}
        <FABSheet
          open={fabOpen}
          onClose={() => setFabOpen(false)}
        />
      </div>
    </LayoutContext.Provider>
  )
}
