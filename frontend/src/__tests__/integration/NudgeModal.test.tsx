import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { NudgeModal } from '../../components/NudgeModal'
import { mockProfile, highLeisureProfile } from '../fixtures/profiles'

// ── Helpers ─────────────────────────────────────────────────

const defaultProps = {
  amount:            50_000,
  category:          'ocio',
  profile:           mockProfile,
  onConfirmDirect:   vi.fn(),
  onPauseAndConfirm: vi.fn(),
  onCancel:          vi.fn(),
}

/**
 * Avanza el modal a la fase de reflexión pasando por el countdown.
 *
 * Cada `act(async () => { vi.advanceTimersByTime(1000) })` hace:
 *   1. Dispara el timer de ese segundo.
 *   2. Deja a React procesar el setState resultante (setCountdown / setPhase).
 *   3. Corre el useEffect del siguiente tick (que crea el próximo timer).
 * El `act(async () => {})` final flushea el setPhase('reflect') que ocurre
 * dentro del efecto cuando countdown llega a 0.
 */
async function advanceToReflect() {
  fireEvent.click(screen.getByText(/Pausar y reflexionar/i))
  await act(async () => { vi.advanceTimersByTime(1000) })  // 3 → 2
  await act(async () => { vi.advanceTimersByTime(1000) })  // 2 → 1
  await act(async () => { vi.advanceTimersByTime(1000) })  // 1 → 0
  await act(async () => {})                                // flush setPhase('reflect')
}

// ══════════════════════════════════════════════════════════════
// NudgeModal
// ══════════════════════════════════════════════════════════════
describe('NudgeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Fase 1: Nudge ───────────────────────────────────────────

  it('muestra la fase de nudge al renderizar', () => {
    render(<NudgeModal {...defaultProps} />)
    expect(screen.getByText(/Antes de confirmar/i)).toBeInTheDocument()
  })

  it('muestra el monto formateado', () => {
    render(<NudgeModal {...defaultProps} amount={150_000} category="alimentacion" />)
    // formatCOP(150_000) debe contener '150'
    const text = screen.getByText(/150/)
    expect(text).toBeInTheDocument()
  })

  it('muestra la categoría "Alimentación" correctamente', () => {
    render(<NudgeModal {...defaultProps} category="alimentacion" />)
    expect(screen.getByText(/Alimentación/i)).toBeInTheDocument()
  })

  it('muestra la categoría "Ocio" correctamente', () => {
    render(<NudgeModal {...defaultProps} category="ocio" />)
    expect(screen.getAllByText(/Ocio/i).length).toBeGreaterThan(0)
  })

  // ── Acciones en fase nudge ──────────────────────────────────

  it('"Registrar de todas formas" llama a onConfirmDirect', () => {
    render(<NudgeModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Registrar de todas formas'))
    expect(defaultProps.onConfirmDirect).toHaveBeenCalledTimes(1)
    expect(defaultProps.onPauseAndConfirm).not.toHaveBeenCalled()
  })

  it('"Cancelar" en fase nudge llama a onCancel', () => {
    render(<NudgeModal {...defaultProps} />)
    // El primer botón "Cancelar" está en fase nudge
    fireEvent.click(screen.getByText('Cancelar'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    expect(defaultProps.onConfirmDirect).not.toHaveBeenCalled()
  })

  // ── Transición a fase de respiración ───────────────────────

  it('"Pausar y reflexionar" transiciona a la fase de respiración', () => {
    render(<NudgeModal {...defaultProps} />)
    fireEvent.click(screen.getByText(/Pausar y reflexionar/i))
    expect(screen.getByText(/Toma un momento/i)).toBeInTheDocument()
  })

  it('muestra el countdown en 3 al inicio de la respiración', () => {
    render(<NudgeModal {...defaultProps} />)
    fireEvent.click(screen.getByText(/Pausar y reflexionar/i))
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('el countdown decrementa a 2 después de 1 segundo', async () => {
    render(<NudgeModal {...defaultProps} />)
    fireEvent.click(screen.getByText(/Pausar y reflexionar/i))
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('el countdown decrementa a 1 después de 2 segundos', async () => {
    render(<NudgeModal {...defaultProps} />)
    fireEvent.click(screen.getByText(/Pausar y reflexionar/i))
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  // ── Transición a fase de reflexión ─────────────────────────

  it('muestra la fase de reflexión luego de 3 segundos', async () => {
    render(<NudgeModal {...defaultProps} />)
    await advanceToReflect()
    // act() ya flusheó todos los updates: la fase reflect debe estar presente
    expect(screen.getByText(/\+25 puntos ganados/i)).toBeInTheDocument()
  })

  it('la fase reflect ya no muestra "Toma un momento"', async () => {
    render(<NudgeModal {...defaultProps} />)
    await advanceToReflect()
    expect(screen.queryByText(/Toma un momento/i)).not.toBeInTheDocument()
  })

  // ── Acciones en fase de reflexión ──────────────────────────

  it('"Sí, registrar el gasto" en reflect llama a onPauseAndConfirm', async () => {
    render(<NudgeModal {...defaultProps} />)
    await advanceToReflect()
    fireEvent.click(screen.getByText('Sí, registrar el gasto'))
    expect(defaultProps.onPauseAndConfirm).toHaveBeenCalledTimes(1)
  })

  it('"Cancelar el gasto" en reflect llama a onCancel', async () => {
    render(<NudgeModal {...defaultProps} />)
    await advanceToReflect()
    fireEvent.click(screen.getByText(/Cancelar el gasto/i))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('onPauseAndConfirm no es llamado desde la fase nudge directa', async () => {
    render(<NudgeModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Registrar de todas formas'))
    expect(defaultProps.onPauseAndConfirm).not.toHaveBeenCalled()
  })

  // ── Advertencia de ocio (leisure warning) ──────────────────

  it('muestra la advertencia de penalización cuando se cumplen las condiciones', () => {
    // highLeisureProfile: leisure=35% ingreso y sin fondo de emergencia suficiente
    render(
      <NudgeModal
        {...defaultProps}
        category="ocio"
        profile={highLeisureProfile}
      />
    )
    expect(screen.getByText(/Penalización activa/i)).toBeInTheDocument()
    expect(screen.getByText(/-15 pts/i)).toBeInTheDocument()
  })

  it('NO muestra la advertencia para categoría distinta de ocio', () => {
    render(
      <NudgeModal
        {...defaultProps}
        category="alimentacion"
        profile={highLeisureProfile}
      />
    )
    expect(screen.queryByText(/Penalización activa/i)).not.toBeInTheDocument()
  })

  it('NO muestra la advertencia cuando el fondo de emergencia es suficiente', () => {
    const safeProfile = {
      ...highLeisureProfile,
      emergency_fund: 1_000_000, // > (fixed 200k + variable 100k) = 300k
    }
    render(<NudgeModal {...defaultProps} category="ocio" profile={safeProfile} />)
    expect(screen.queryByText(/Penalización activa/i)).not.toBeInTheDocument()
  })

  it('NO muestra la advertencia cuando el ocio está por debajo del 30%', () => {
    const lowLeisureProfile = {
      ...highLeisureProfile,
      leisure_expenses: 200_000, // 20% de 1M < 30%
    }
    render(<NudgeModal {...defaultProps} category="ocio" profile={lowLeisureProfile} />)
    expect(screen.queryByText(/Penalización activa/i)).not.toBeInTheDocument()
  })

  // ── Indicador de +25 pts en botón de pausa ─────────────────

  it('el botón de pausa muestra "+25 pts" como incentivo', () => {
    render(<NudgeModal {...defaultProps} />)
    expect(screen.getByText('+25 pts')).toBeInTheDocument()
  })
})
