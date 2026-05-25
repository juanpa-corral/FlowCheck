import { describe, it, expect } from 'vitest'
import { getLevelInfo } from '../../hooks/usePoints'

// ══════════════════════════════════════════════════════════════
// getLevelInfo — sistema de niveles por puntos
//
// Niveles:
//   1: 0-499     Comenzando 🌱
//   2: 500-999   Avanzando  📈
//   3: 1000-1999 Disciplinado 💪
//   4: 2000-4999 Experto 🏆
//   5: 5000+     Maestro Financiero 🌟
// ══════════════════════════════════════════════════════════════

describe('getLevelInfo — fronteras de nivel', () => {
  it('0 pts → nivel 1, Comenzando 🌱', () => {
    const info = getLevelInfo(0)
    expect(info.level).toBe(1)
    expect(info.name).toBe('Comenzando')
    expect(info.emoji).toBe('🌱')
  })

  it('499 pts → aún nivel 1', () => {
    expect(getLevelInfo(499).level).toBe(1)
    expect(getLevelInfo(499).name).toBe('Comenzando')
  })

  it('500 pts → nivel 2, Avanzando 📈', () => {
    const info = getLevelInfo(500)
    expect(info.level).toBe(2)
    expect(info.name).toBe('Avanzando')
    expect(info.emoji).toBe('📈')
  })

  it('999 pts → aún nivel 2', () => {
    expect(getLevelInfo(999).level).toBe(2)
  })

  it('1000 pts → nivel 3, Disciplinado 💪', () => {
    const info = getLevelInfo(1000)
    expect(info.level).toBe(3)
    expect(info.name).toBe('Disciplinado')
    expect(info.emoji).toBe('💪')
  })

  it('1999 pts → aún nivel 3', () => {
    expect(getLevelInfo(1999).level).toBe(3)
  })

  it('2000 pts → nivel 4, Experto 🏆', () => {
    const info = getLevelInfo(2000)
    expect(info.level).toBe(4)
    expect(info.name).toBe('Experto')
    expect(info.emoji).toBe('🏆')
  })

  it('4999 pts → aún nivel 4', () => {
    expect(getLevelInfo(4999).level).toBe(4)
  })

  it('5000 pts → nivel 5, Maestro Financiero 🌟', () => {
    const info = getLevelInfo(5000)
    expect(info.level).toBe(5)
    expect(info.name).toBe('Maestro Financiero')
    expect(info.emoji).toBe('🌟')
  })

  it('99999 pts → sigue siendo nivel 5 (nivel máximo)', () => {
    expect(getLevelInfo(99999).level).toBe(5)
  })
})

describe('getLevelInfo — nextLevelPts', () => {
  it('nivel 1 → siguiente nivel en 500 pts', () => {
    expect(getLevelInfo(0).nextLevelPts).toBe(500)
    expect(getLevelInfo(250).nextLevelPts).toBe(500)
  })

  it('nivel 2 → siguiente nivel en 1000 pts', () => {
    expect(getLevelInfo(500).nextLevelPts).toBe(1000)
    expect(getLevelInfo(750).nextLevelPts).toBe(1000)
  })

  it('nivel 3 → siguiente nivel en 2000 pts', () => {
    expect(getLevelInfo(1000).nextLevelPts).toBe(2000)
    expect(getLevelInfo(1500).nextLevelPts).toBe(2000)
  })

  it('nivel 4 → siguiente nivel en 5000 pts', () => {
    expect(getLevelInfo(2000).nextLevelPts).toBe(5000)
    expect(getLevelInfo(3500).nextLevelPts).toBe(5000)
  })

  it('nivel 5 (máximo) → nextLevelPts = 5000 (ya alcanzado)', () => {
    expect(getLevelInfo(5000).nextLevelPts).toBe(5000)
    expect(getLevelInfo(9000).nextLevelPts).toBe(5000)
  })
})

describe('getLevelInfo — progress', () => {
  it('0% al inicio del nivel 1', () => {
    expect(getLevelInfo(0).progress).toBe(0)
  })

  it('50% en el punto medio del nivel 1 (250 pts)', () => {
    // progress = (250-0)/(500-0) * 100 = 50%
    expect(getLevelInfo(250).progress).toBeCloseTo(50, 1)
  })

  it('50% en el punto medio del nivel 2 (750 pts)', () => {
    // progress = (750-500)/(1000-500) * 100 = 50%
    expect(getLevelInfo(750).progress).toBeCloseTo(50, 1)
  })

  it('50% en el punto medio del nivel 3 (1500 pts)', () => {
    // progress = (1500-1000)/(2000-1000) * 100 = 50%
    expect(getLevelInfo(1500).progress).toBeCloseTo(50, 1)
  })

  it('50% en el punto medio del nivel 4 (3500 pts)', () => {
    // progress = (3500-2000)/(5000-2000) * 100 = 50%
    expect(getLevelInfo(3500).progress).toBeCloseTo(50, 1)
  })

  it('100% en nivel 5 (nivel máximo)', () => {
    expect(getLevelInfo(5000).progress).toBe(100)
    expect(getLevelInfo(9999).progress).toBe(100)
  })

  it('nunca supera 100%', () => {
    const info = getLevelInfo(99999)
    expect(info.progress).toBeLessThanOrEqual(100)
  })

  it('nunca es negativo', () => {
    [0, 1, 499, 500, 1000, 5000].forEach((pts) => {
      expect(getLevelInfo(pts).progress).toBeGreaterThanOrEqual(0)
    })
  })
})
