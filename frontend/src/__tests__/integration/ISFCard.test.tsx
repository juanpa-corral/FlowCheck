import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ISFCard } from '../../components/ISFCard'
import type { ISFBreakdown } from '../../types/database'

// ── Fixtures ────────────────────────────────────────────────

const excellentBreakdown: ISFBreakdown = {
  total: 85,
  savingsScore:   30,
  leisureScore:   20,
  emergencyScore: 25,
  debtScore:      10,
}

const goodBreakdown: ISFBreakdown = {
  total: 65,
  savingsScore:   20,
  leisureScore:   15,
  emergencyScore: 20,
  debtScore:      10,
}

const moderateBreakdown: ISFBreakdown = {
  total: 45,
  savingsScore:   10,
  leisureScore:   10,
  emergencyScore: 15,
  debtScore:      10,
}

const poorBreakdown: ISFBreakdown = {
  total: 20,
  savingsScore:    0,
  leisureScore:    0,
  emergencyScore: 10,
  debtScore:      10,
}

// ══════════════════════════════════════════════════════════════
// ISFCard
// ══════════════════════════════════════════════════════════════
describe('ISFCard', () => {

  // ── Renderizado básico ──────────────────────────────────────

  it('muestra el título del índice', () => {
    render(<ISFCard breakdown={excellentBreakdown} />)
    expect(screen.getByText(/Índice de Salud Financiera/i)).toBeInTheDocument()
  })

  it('muestra la puntuación total como número', () => {
    render(<ISFCard breakdown={excellentBreakdown} />)
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('muestra "/100" como sufijo', () => {
    render(<ISFCard breakdown={excellentBreakdown} />)
    expect(screen.getByText('/100')).toBeInTheDocument()
  })

  // ── Labels según rango de score ─────────────────────────────

  it('→ "Salud Excelente" cuando total ≥ 80', () => {
    render(<ISFCard breakdown={excellentBreakdown} />)
    expect(screen.getByText('Salud Excelente')).toBeInTheDocument()
  })

  it('→ "Salud Buena" cuando total 60-79', () => {
    render(<ISFCard breakdown={goodBreakdown} />)
    expect(screen.getByText('Salud Buena')).toBeInTheDocument()
  })

  it('→ "Salud Moderada" cuando total 40-59', () => {
    render(<ISFCard breakdown={moderateBreakdown} />)
    expect(screen.getByText('Salud Moderada')).toBeInTheDocument()
  })

  it('→ "Necesita Atención" cuando total < 40', () => {
    render(<ISFCard breakdown={poorBreakdown} />)
    expect(screen.getByText('Necesita Atención')).toBeInTheDocument()
  })

  // ── Desglose de sub-scores ──────────────────────────────────

  it('muestra las 4 etiquetas de los componentes', () => {
    render(<ISFCard breakdown={excellentBreakdown} />)
    expect(screen.getByText('Ahorro')).toBeInTheDocument()
    expect(screen.getByText('Ocio controlado')).toBeInTheDocument()
    expect(screen.getByText('Fondo emergencia')).toBeInTheDocument()
    expect(screen.getByText('Carga de deuda')).toBeInTheDocument()
  })

  it('muestra los sub-scores con su máximo correcto', () => {
    render(<ISFCard breakdown={excellentBreakdown} />)
    expect(screen.getByText('30/30')).toBeInTheDocument()  // savingsScore / max30
    expect(screen.getByText('20/20')).toBeInTheDocument()  // leisureScore / max20
    expect(screen.getByText('25/30')).toBeInTheDocument()  // emergencyScore / max30
    expect(screen.getByText('10/20')).toBeInTheDocument()  // debtScore / max20
  })

  it('muestra 0 cuando los sub-scores son cero', () => {
    render(<ISFCard breakdown={poorBreakdown} />)
    expect(screen.getByText('0/30')).toBeInTheDocument()   // savingsScore=0
    expect(screen.getByText('0/20')).toBeInTheDocument()   // leisureScore=0
  })

  // ── Mensaje motivacional ───────────────────────────────────

  it('muestra un mensaje textual debajo del score', () => {
    render(<ISFCard breakdown={excellentBreakdown} />)
    // El mensaje de score ≥80: "¡Vas increíble!..."
    expect(screen.getByText(/increíble|disciplina/i)).toBeInTheDocument()
  })

  it('muestra mensaje empático para score bajo', () => {
    render(<ISFCard breakdown={poorBreakdown} />)
    expect(screen.getByText(/juntos|avanzamos/i)).toBeInTheDocument()
  })
})
