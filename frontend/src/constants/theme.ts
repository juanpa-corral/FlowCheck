// ============================================================
// FlowCheck 2.0 — Sistema de Diseño (CSS Custom Properties)
// Los valores reales viven en index.html :root / html.dark
// Al cambiar el tema solo se actualiza la clase "dark" en <html>
// ============================================================

export const Colors = {
  // ── Brand ────────────────────────────────────────────────
  primary:       'var(--c-primary)',
  primaryLight:  'var(--c-primary-light)',
  primaryDark:   'var(--c-primary-dark)',

  // Alias verde (= primary en este diseño)
  green:         'var(--c-primary)',
  greenLight:    'var(--c-primary-light)',
  greenDark:     'var(--c-primary-dark)',

  // Alphas del brand (usar en lugar de `${Colors.primary}30` etc.)
  primaryA10:    'var(--c-primary-a10)',
  primaryA20:    'var(--c-primary-a20)',
  primaryA30:    'var(--c-primary-a30)',
  primaryA40:    'var(--c-primary-a40)',
  greenA30:      'var(--c-primary-a30)',   // alias para legibilidad
  greenA40:      'var(--c-primary-a40)',

  // ── Alerta ────────────────────────────────────────────────
  yellow:        'var(--c-yellow)',
  yellowLight:   'var(--c-yellow-light)',
  yellowDark:    'var(--c-yellow-dark)',
  yellowA40:     'var(--c-yellow-a40)',

  // ── Riesgo ────────────────────────────────────────────────
  red:           'var(--c-red)',
  redLight:      'var(--c-red-light)',
  redDark:       'var(--c-red-dark)',
  redA20:        'var(--c-red-a20)',
  redA30:        'var(--c-red-a30)',

  // ── Layout ────────────────────────────────────────────────
  background:    'var(--c-bg)',
  card:          'var(--c-card)',
  cardElevated:  'var(--c-card-elevated)',
  border:        'var(--c-border)',

  // ── Texto ────────────────────────────────────────────────
  textPrimary:   'var(--c-text-primary)',
  textSecondary: 'var(--c-text-secondary)',
  textMuted:     'var(--c-text-muted)',

  // ── Especiales ───────────────────────────────────────────
  white: '#FFFFFF',    // siempre blanco (no cambia con tema)
} as const

// ── Radios (design token) ─────────────────────────────────────
export const Radius = {
  card:   16,
  button: 12,
  chip:   9999,
  input:  10,
  badge:  8,
} as const

// ── Tipografía ────────────────────────────────────────────────
export const Font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  weightNormal:   400,
  weightMedium:   500,
  weightSemibold: 600,
  weightBold:     700,
  weightBlack:    800,
} as const

// ── Umbrales ISF ──────────────────────────────────────────────
export const ISF_THRESHOLDS = {
  low:    40,
  medium: 70,
} as const

// ── Semáforo de presupuesto ───────────────────────────────────
export const SEMAPHORE_THRESHOLDS = {
  green:  50,   // < 50% comprometido → verde
  yellow: 75,   // 50-75%             → alerta
  // > 75%                            → riesgo
} as const
