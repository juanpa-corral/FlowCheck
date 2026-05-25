import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Semaphore } from '../../components/Semaphore'
import type { BudgetSemaphore } from '../../types/database'

// ── Fixtures ────────────────────────────────────────────────

const verde: BudgetSemaphore    = { status: 'verde',    percentage: 40, committed:  400_000, income: 1_000_000 }
const amarillo: BudgetSemaphore = { status: 'amarillo', percentage: 65, committed:  650_000, income: 1_000_000 }
const rojo: BudgetSemaphore     = { status: 'rojo',     percentage: 90, committed:  900_000, income: 1_000_000 }

// ══════════════════════════════════════════════════════════════
// Semaphore
// ══════════════════════════════════════════════════════════════
describe('Semaphore', () => {

  // ── Renderizado básico ──────────────────────────────────────

  it('muestra el título "Semáforo de Presupuesto"', () => {
    render(<Semaphore data={verde} />)
    expect(screen.getByText(/Semáforo de Presupuesto/i)).toBeInTheDocument()
  })

  it('muestra el porcentaje comprometido', () => {
    render(<Semaphore data={verde} />)
    expect(screen.getByText('40.0%')).toBeInTheDocument()
  })

  it('muestra la leyenda "del ingreso gastado este mes"', () => {
    render(<Semaphore data={verde} />)
    expect(screen.getByText(/del ingreso gastado este mes/i)).toBeInTheDocument()
  })

  // ── Mensajes según status ───────────────────────────────────

  it('→ "Bien" y mensaje positivo para status verde', () => {
    render(<Semaphore data={verde} />)
    expect(screen.getByText('Bien')).toBeInTheDocument()
    expect(screen.getByText(/¡Vas bien este mes/i)).toBeInTheDocument()
  })

  it('→ "Atención" y mensaje de aviso para status amarillo', () => {
    render(<Semaphore data={amarillo} />)
    expect(screen.getByText('Atención')).toBeInTheDocument()
    expect(screen.getByText(/más de la mitad/i)).toBeInTheDocument()
  })

  it('→ "Alerta" y mensaje de riesgo para status rojo', () => {
    render(<Semaphore data={rojo} />)
    expect(screen.getByText('Alerta')).toBeInTheDocument()
    expect(screen.getByText(/Superaste el límite/i)).toBeInTheDocument()
  })

  // ── Solo el estado activo muestra su label ──────────────────

  it('cuando es verde, no muestra las labels de los otros estados', () => {
    render(<Semaphore data={verde} />)
    expect(screen.queryByText('Alerta')).not.toBeInTheDocument()
    expect(screen.queryByText('Atención')).not.toBeInTheDocument()
  })

  it('cuando es amarillo, no muestra las labels de los otros estados', () => {
    render(<Semaphore data={amarillo} />)
    expect(screen.queryByText('Alerta')).not.toBeInTheDocument()
    expect(screen.queryByText('Bien')).not.toBeInTheDocument()
  })

  it('cuando es rojo, no muestra las labels de los otros estados', () => {
    render(<Semaphore data={rojo} />)
    expect(screen.queryByText('Bien')).not.toBeInTheDocument()
    expect(screen.queryByText('Atención')).not.toBeInTheDocument()
  })

  // ── Sección Gastado / Disponible ───────────────────────────

  it('muestra las etiquetas "Gastado" y "Disponible"', () => {
    render(<Semaphore data={verde} />)
    expect(screen.getByText('Gastado')).toBeInTheDocument()
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })

  it('calcula "Disponible" como ingreso - comprometido', () => {
    // verde: income=1M, committed=400k → disponible=600k
    // formatCOP(600_000) debe contener '600'
    render(<Semaphore data={verde} />)
    const availableSection = screen.getByText('Disponible').closest('div')
    expect(availableSection?.textContent).toContain('600')
  })

  // ── Porcentaje en pantalla ─────────────────────────────────

  it('muestra el porcentaje de amarillo correctamente', () => {
    render(<Semaphore data={amarillo} />)
    expect(screen.getByText('65.0%')).toBeInTheDocument()
  })

  it('muestra el porcentaje de rojo correctamente', () => {
    render(<Semaphore data={rojo} />)
    expect(screen.getByText('90.0%')).toBeInTheDocument()
  })
})
