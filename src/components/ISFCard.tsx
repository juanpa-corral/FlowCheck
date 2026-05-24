import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ISF_THRESHOLDS } from '../constants/theme';
import type { ISFBreakdown } from '../types/database';
import { getISFLabel, getISFMessage } from '../hooks/useISF';

interface ISFCardProps {
  breakdown: ISFBreakdown;
}

function scoreColor(total: number): string {
  if (total >= ISF_THRESHOLDS.medium) return Colors.green;
  if (total >= ISF_THRESHOLDS.low) return Colors.yellow;
  return Colors.red;
}

interface ScoreRowProps {
  label: string;
  score: number;
  max: number;
}

function ScoreRow({ label, score, max }: ScoreRowProps) {
  const pct = (score / max) * 100;
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreTrack}>
        <View
          style={[
            styles.scoreFill,
            { width: `${pct}%`, backgroundColor: scoreColor(pct) },
          ]}
        />
      </View>
      <Text style={styles.scoreNum}>
        {score}/{max}
      </Text>
    </View>
  );
}

export function ISFCard({ breakdown }: ISFCardProps) {
  const { total, savingsScore, leisureScore, emergencyScore, debtScore } = breakdown;
  const color = scoreColor(total);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Índice de Salud Financiera</Text>

      {/* Big score */}
      <View style={[styles.scoreBadge, { borderColor: color }]}>
        <Text style={[styles.scoreDisplay, { color }]}>{Math.round(total)}</Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>

      <Text style={[styles.statusLabel, { color }]}>{getISFLabel(total)}</Text>
      <Text style={styles.message}>{getISFMessage(total)}</Text>

      {/* Breakdown */}
      <View style={styles.breakdown}>
        <ScoreRow label="Ahorro" score={savingsScore} max={30} />
        <ScoreRow label="Ocio controlado" score={leisureScore} max={20} />
        <ScoreRow label="Fondo emergencia" score={emergencyScore} max={30} />
        <ScoreRow label="Carga de deuda" score={debtScore} max={20} />
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
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 3,
    borderRadius: BorderRadius.full,
    width: 110,
    height: 110,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  scoreDisplay: {
    fontSize: FontSize.display,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '600',
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  breakdown: {
    width: '100%',
    gap: Spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    width: 108,
  },
  scoreTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  scoreNum: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    width: 32,
    textAlign: 'right',
  },
});
