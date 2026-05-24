export const Colors = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDark: '#3730A3',

  green: '#10B981',
  greenLight: '#D1FAE5',
  greenDark: '#059669',

  yellow: '#F59E0B',
  yellowLight: '#FEF3C7',
  yellowDark: '#D97706',

  red: '#EF4444',
  redLight: '#FEE2E2',
  redDark: '#DC2626',

  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',

  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  white: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const ISF_THRESHOLDS = {
  low: 40,
  medium: 70,
} as const;

export const SEMAPHORE_THRESHOLDS = {
  green: 50,  // < 50% del ingreso comprometido → verde
  yellow: 75, // 50-75% → amarillo
  // > 75% → rojo
} as const;
