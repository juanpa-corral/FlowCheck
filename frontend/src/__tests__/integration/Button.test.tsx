import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../components/Button'

describe('Button', () => {

  // ── Renderizado básico ──────────────────────────────────────

  it('muestra el label correctamente', () => {
    render(<Button label="Iniciar sesión" onClick={() => {}} />)
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
  })

  it('renderiza un elemento button HTML', () => {
    render(<Button label="Guardar" onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  // ── Interacción ────────────────────────────────────────────

  it('llama a onClick cuando se hace clic', () => {
    const onClick = vi.fn()
    render(<Button label="Click me" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('llama a onClick múltiples veces', () => {
    const onClick = vi.fn()
    render(<Button label="Multi" onClick={onClick} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  // ── Estado disabled ────────────────────────────────────────

  it('NO llama a onClick cuando disabled=true', () => {
    const onClick = vi.fn()
    render(<Button label="Deshabilitado" onClick={onClick} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('el botón tiene atributo disabled cuando disabled=true', () => {
    render(<Button label="Deshabilitado" onClick={() => {}} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  // ── Estado loading ─────────────────────────────────────────

  it('NO muestra el label cuando loading=true (muestra spinner)', () => {
    render(<Button label="Guardar" onClick={() => {}} loading />)
    expect(screen.queryByText('Guardar')).not.toBeInTheDocument()
  })

  it('el botón tiene atributo disabled cuando loading=true', () => {
    render(<Button label="Cargando" onClick={() => {}} loading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('NO llama a onClick cuando loading=true', () => {
    const onClick = vi.fn()
    render(<Button label="Loading" onClick={onClick} loading />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  // ── Variantes ──────────────────────────────────────────────

  it('renderiza variante "primary" por defecto', () => {
    render(<Button label="Primary" onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renderiza variante "outline" sin errores', () => {
    render(<Button label="Outline" onClick={() => {}} variant="outline" />)
    expect(screen.getByText('Outline')).toBeInTheDocument()
  })

  it('renderiza variante "ghost" sin errores', () => {
    render(<Button label="Ghost" onClick={() => {}} variant="ghost" />)
    expect(screen.getByText('Ghost')).toBeInTheDocument()
  })

  // ── Combinaciones ──────────────────────────────────────────

  it('disabled+loading: ambos deshabilitan el botón', () => {
    render(<Button label="Both" onClick={() => {}} disabled loading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
