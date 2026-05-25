import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { ThemeProvider } from './contexts/ThemeContext'
import { MobileLayout } from './components/layout/MobileLayout'
import { useProfileStore, initProfileRealtime } from './stores/profileStore'
import { Colors } from './constants/theme'

// ── Pages ────────────────────────────────────────────────────

import AuthPage         from './pages/auth/AuthPage'
import Step1Identity    from './pages/onboarding/Step1Identity'
import Step2Income      from './pages/onboarding/Step2Income'
import Step3Expenses    from './pages/onboarding/Step3Expenses'
import Step4Debt        from './pages/onboarding/Step4Debt'
import Step5Goals       from './pages/onboarding/Step5Goals'
import Step6RiskProfile from './pages/onboarding/Step6RiskProfile'
import DashboardPage    from './pages/dashboard/DashboardPage'
import AddTransactionPage from './pages/registrar/AddTransactionPage'
import MarketplacePage  from './pages/marketplace/MarketplacePage'
import EducacionPage    from './pages/educacion/EducacionPage'
import InversionesPage  from './pages/inversiones/InversionesPage'
import CreditoPage      from './pages/credito/CreditoPage'
import CuentasPage      from './pages/cuentas/CuentasPage'
import AnaliticaPage    from './pages/analitica/AnaliticaPage'

// ── Loading screen ────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', backgroundColor: Colors.background, gap: 12,
      }}
    >
      <span style={{ fontSize: 52 }}>💚</span>
      <p style={{ color: Colors.textSecondary, fontSize: 16, margin: 0 }}>
        Cargando FlowCheck…
      </p>
    </div>
  )
}

// ── Shell autenticado (inyecta nombre/puntos en el layout) ────

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore()
  const userId      = session?.user?.id
  const store       = useProfileStore()

  // Init una vez + Realtime singleton (no más de un canal por userId)
  useEffect(() => {
    if (!userId) return
    store.init(userId)
    const cleanup = initProfileRealtime(userId)
    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return (
    <MobileLayout
      userName={store.profile?.full_name ?? ''}
      totalPoints={store.profile?.total_points ?? 0}
    >
      {children}
    </MobileLayout>
  )
}

// ── Componente raíz ───────────────────────────────────────────

export default function App() {
  const { session, loading, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  if (loading) return <LoadingScreen />

  return (
    <ThemeProvider>
      <BrowserRouter>
        {/*
          El contenedor externo centra la "pantalla de teléfono" en escritorio.
          En móvil ocupa el 100% del ancho. El id="phone-shell" recibe
          border-radius vía CSS media query en index.html.
        */}
        <div
          style={{
            maxWidth: 480,
            margin: '0 auto',
            minHeight: '100dvh',
            backgroundColor: Colors.background,
            position: 'relative',
          }}
        >
          <Routes>
            {/* ── Auth ── */}
            <Route
              path="/login"
              element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />}
            />

            {/* ── Onboarding (sin MobileLayout) ── */}
            <Route path="/onboarding/1" element={session ? <Step1Identity />    : <Navigate to="/login" replace />} />
            <Route path="/onboarding/2" element={session ? <Step2Income />      : <Navigate to="/login" replace />} />
            <Route path="/onboarding/3" element={session ? <Step3Expenses />    : <Navigate to="/login" replace />} />
            <Route path="/onboarding/4" element={session ? <Step4Debt />        : <Navigate to="/login" replace />} />
            <Route path="/onboarding/5" element={session ? <Step5Goals />       : <Navigate to="/login" replace />} />
            <Route path="/onboarding/6" element={session ? <Step6RiskProfile /> : <Navigate to="/login" replace />} />

            {/* ── Rutas autenticadas con MobileLayout ── */}
            <Route path="/dashboard"   element={session ? <AuthenticatedShell><DashboardPage /></AuthenticatedShell>      : <Navigate to="/login" replace />} />
            <Route path="/registrar"   element={session ? <AuthenticatedShell><AddTransactionPage /></AuthenticatedShell>  : <Navigate to="/login" replace />} />
            <Route path="/marketplace" element={session ? <AuthenticatedShell><MarketplacePage /></AuthenticatedShell>     : <Navigate to="/login" replace />} />
            <Route path="/educacion"   element={session ? <AuthenticatedShell><EducacionPage /></AuthenticatedShell>       : <Navigate to="/login" replace />} />
            <Route path="/inversiones" element={session ? <AuthenticatedShell><InversionesPage /></AuthenticatedShell>    : <Navigate to="/login" replace />} />
            <Route path="/credito"     element={session ? <AuthenticatedShell><CreditoPage /></AuthenticatedShell>        : <Navigate to="/login" replace />} />
            <Route path="/cuentas"     element={session ? <AuthenticatedShell><CuentasPage /></AuthenticatedShell>        : <Navigate to="/login" replace />} />
            <Route path="/analitica"   element={session ? <AuthenticatedShell><AnaliticaPage /></AuthenticatedShell>      : <Navigate to="/login" replace />} />

            {/* ── Catch-all ── */}
            <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
