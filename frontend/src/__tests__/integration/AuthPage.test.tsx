import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mock de Supabase ────────────────────────────────────────
// vi.mock se hoist antes de los imports → el módulo real nunca se carga
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
    },
  },
}))

import AuthPage from '../../pages/auth/AuthPage'
import { supabase } from '../../lib/supabase'

const signIn = vi.mocked(supabase.auth.signInWithPassword)
const signUp = vi.mocked(supabase.auth.signUp)

// ══════════════════════════════════════════════════════════════
// AuthPage
// ══════════════════════════════════════════════════════════════
describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Renderizado ─────────────────────────────────────────────

  it('muestra el nombre de la app FlowCheck', () => {
    render(<AuthPage />)
    expect(screen.getByText('FlowCheck')).toBeInTheDocument()
  })

  it('muestra el campo de correo', () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument()
  })

  it('muestra el campo de contraseña', () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('arranca en modo login', () => {
    render(<AuthPage />)
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument()
  })

  // ── Toggle login / registro ─────────────────────────────────

  it('cambia a modo registro al hacer clic en el enlace', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByText(/¿No tienes cuenta\?/i))
    expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear cuenta/i })).toBeInTheDocument()
  })

  it('vuelve a modo login desde registro', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByText(/¿No tienes cuenta\?/i))
    await user.click(screen.getByText(/¿Ya tienes cuenta\?/i))
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument()
  })

  it('limpia el error al cambiar de modo', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    // Provocar error
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    expect(screen.getByText(/completa todos los campos/i)).toBeInTheDocument()
    // Cambiar a registro → error debe desaparecer
    await user.click(screen.getByText(/¿No tienes cuenta\?/i))
    expect(screen.queryByText(/completa todos los campos/i)).not.toBeInTheDocument()
  })

  // ── Validaciones del formulario ─────────────────────────────

  it('muestra error si los campos están vacíos al intentar login', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    expect(screen.getByText('Por favor completa todos los campos.')).toBeInTheDocument()
  })

  it('muestra error si la contraseña tiene < 6 caracteres en registro', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByText(/¿No tienes cuenta\?/i))
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), '123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }))
    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument()
  })

  it('NO llama a signUp si la contraseña es muy corta', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByText(/¿No tienes cuenta\?/i))
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), '123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }))
    expect(signUp).not.toHaveBeenCalled()
  })

  // ── Toggle ver / ocultar contraseña ────────────────────────

  it('el campo de contraseña empieza como type="password"', () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
  })

  it('revela la contraseña al hacer clic en el ojo', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /Ver contraseña/i }))
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text')
  })

  it('oculta la contraseña en el segundo clic', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /Ver contraseña/i }))
    await user.click(screen.getByRole('button', { name: /Ocultar contraseña/i }))
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
  })

  // ── Llamadas a Supabase ─────────────────────────────────────

  it('llama a signInWithPassword con las credenciales correctas', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'ana@ejemplo.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'mipassword123')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'ana@ejemplo.com',
        password: 'mipassword123',
      })
    })
  })

  it('llama a signUp con las credenciales correctas en modo registro', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByText(/¿No tienes cuenta\?/i))
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'nuevo@ejemplo.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'securepassword')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }))
    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: 'nuevo@ejemplo.com',
        password: 'securepassword',
      })
    })
  })

  it('NO llama a signInWithPassword si los campos están vacíos', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    expect(signIn).not.toHaveBeenCalled()
  })

  // ── Errores traducidos ──────────────────────────────────────

  it('muestra "Correo o contraseña incorrectos." para credenciales inválidas', async () => {
    signIn.mockResolvedValueOnce({
      data: {} as any,
      error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 } as any,
    })
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    await waitFor(() => {
      expect(screen.getByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    })
  })

  it('muestra error de email no confirmado traducido al español', async () => {
    signIn.mockResolvedValueOnce({
      data: {} as any,
      error: { message: 'Email not confirmed', name: 'AuthError', status: 400 } as any,
    })
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'mypassword')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    await waitFor(() => {
      expect(screen.getByText(/Confirma tu correo/i)).toBeInTheDocument()
    })
  })

  // ── Enter para enviar ───────────────────────────────────────

  it('envía el formulario al presionar Enter en el campo de correo', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    // Llenar ambos campos ANTES de presionar Enter
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    // Enfocar campo de correo y pulsar Enter
    await user.click(screen.getByPlaceholderText('tu@correo.com'))
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(signIn).toHaveBeenCalled()
    })
  })

  it('envía el formulario al presionar Enter en el campo de contraseña', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'test@test.com')
    // {Enter} al final del campo de contraseña (ambos ya llenos)
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123{Enter}')
    await waitFor(() => {
      expect(signIn).toHaveBeenCalled()
    })
  })
})
