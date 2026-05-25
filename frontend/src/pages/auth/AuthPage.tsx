import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { Colors } from '../../constants/theme'

const S = {
  container: {
    flexGrow: 1,
    padding: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: Colors.background,
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: { fontSize: 56, marginBottom: 8 },
  appName: {
    fontSize: 28,
    fontWeight: 800 as const,
    color: Colors.primary,
    letterSpacing: '-0.5px',
  },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  formTitle: { fontSize: 22, fontWeight: 700 as const, color: Colors.textPrimary },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  label: { fontSize: 14, fontWeight: 600 as const, color: Colors.textPrimary },
  input: {
    height: 48,
    border: `1.5px solid ${Colors.border}`,
    borderRadius: 8,
    padding: '0 16px',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  error: {
    padding: '10px 14px',
    backgroundColor: Colors.redLight,
    borderRadius: 8,
    fontSize: 14,
    color: Colors.red,
    lineHeight: '20px',
    whiteSpace: 'pre-line' as const,
  },
}

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async () => {
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }
    if (!isLogin && password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)

    if (isLogin) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(translateError(authError.message))
      }
    } else {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(translateError(authError.message))
      } else if (data.user && !data.session) {
        // Supabase requiere confirmación de email
        setError('✉️ Revisa tu correo y confirma tu cuenta antes de iniciar sesión.\n(O desactiva "Confirm email" en Supabase Dashboard → Auth → Providers → Email para desarrollo)')
      }
    }

    setLoading(false)
  }

  /** Traduce mensajes de error de Supabase al español */
  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials'))  return 'Correo o contraseña incorrectos.'
    if (msg.includes('Email not confirmed'))         return 'Confirma tu correo antes de iniciar sesión.'
    if (msg.includes('User already registered'))     return 'Ya existe una cuenta con este correo.'
    if (msg.includes('Password should be'))          return 'La contraseña debe tener al menos 6 caracteres.'
    if (msg.includes('Unable to validate'))          return 'Error del servidor. Verifica que el schema SQL esté ejecutado en Supabase.'
    if (msg.includes('Database error'))              return 'Error de base de datos. Ejecuta supabase/schema.sql en tu proyecto Supabase.'
    if (msg.includes('500'))                         return 'Error del servidor (500). Revisa que el schema SQL esté aplicado en Supabase y que el trigger handle_new_user() exista.'
    return msg
  }

  return (
    <div style={S.container}>
      {/* Logo */}
      <div style={S.logoContainer}>
        <span style={S.logo}>💚</span>
        <span style={S.appName}>FlowCheck</span>
        <span style={S.tagline}>Tu asesor de salud financiera</span>
      </div>

      {/* Form */}
      <div style={S.form}>
        <p style={S.formTitle}>
          {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
        </p>

        {error && <div style={S.error}>{error}</div>}

        <div style={S.inputGroup}>
          <label style={S.label}>Correo electrónico</label>
          <input
            style={S.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />
        </div>

        <div style={S.inputGroup}>
          <label style={S.label}>Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...S.input, paddingRight: 48 }}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: Colors.textMuted,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showPassword
                ? <EyeOff size={18} strokeWidth={2} />
                : <Eye size={18} strokeWidth={2} />
              }
            </button>
          </div>
        </div>

        <Button
          label={isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          onClick={handleAuth}
          loading={loading}
          className="w-full"
        />

        <Button
          label={
            isLogin
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'
          }
          onClick={() => { setIsLogin(!isLogin); setError(null) }}
          variant="ghost"
          className="w-full"
        />
      </div>
    </div>
  )
}
