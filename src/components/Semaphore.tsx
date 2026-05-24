import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import type { BudgetSemaphore } from '../types/database';
import { formatCOP, formatPercent } from '../utils/formatters';

interface SemaphoreProps {
  data: BudgetSemaphore;
}

const LIGHTS: Array<{ key: BudgetSemaphore['status']; color: string; label: string }> = [
  { key: 'rojo', color: Colors.red, label: 'Alerta' },
  { key: 'amarillo', color: Colors.yellow, label: 'Atención' },
  { key: 'verde', color: Colors.green, label: 'Bien' },
];

const STATUS_MESSAGES: Record<BudgetSemaphore['status'], string> = {
  verde: 'Tu presupuesto tiene buena salud. ¡Sigue así!',
  amarillo: 'Tus gastos consumen buena parte del ingreso. Revisa dónde puedes optimizar.',
  rojo: 'Tus compromisos superan el límite recomendado. Hagamos un plan juntos.',
};

export function Semaphore({ data }: SemaphoreProps) {
  const { status, percentage, committed, income } = data;
  const savings = Math.max(0, income - committed);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Semáforo de Presupuesto</Text>

      {/* Traffic light */}
      <View style={styles.lightContainer}>
        {LIGHTS.map((light) => {
          const isActive = light.key === status;
          return (
            <View key={light.key} style={styles.lightWrapper}>
              <View
                style={[
                  styles.light,
                  { backgroundColor: light.color },
                  !isActive && styles.lightInactive,
                ]}
              />
              {isActive && (
                <Text style={[styles.lightLabel, { color: light.color }]}>
                  {light.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Percentage */}
      <Text style={styles.percentage}>{formatPercent(percentage)}</Text>
      <Text style={styles.subtitle}>del ingreso comprometido</Text>

      {/* Breakdown */}
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Comprometido</Text>
          <Text style={[styles.statValue, { color: Colors.red }]}>
            {formatCOP(committed)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Disponible</Text>
          <Text style={[styles.statValue, { color: Colors.green }]}>
            {formatCOP(savings)}
          </Text>
        </View>
      </View>

      {/* Message */}
      <View style={[styles.messageBadge, styles[`${status}Badge`]]}>
        <Text style={styles.messageText}>{STATUS_MESSAGES[status]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  lightContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  lightWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  light: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  lightInactive: {
    opacity: 0.2,
  },
  lightLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  percentage: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  messageBadge: {
    width: '100%',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  verdeBadge: { backgroundColor: Colors.greenLight },
  amarilloBadge: { backgroundColor: Colors.yellowLight },
  rojoBadge: { backgroundColor: Colors.redLight },
  messageText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
