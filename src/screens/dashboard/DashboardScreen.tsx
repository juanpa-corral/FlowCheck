import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useProfile } from '../../hooks/useProfile';
import { useISF } from '../../hooks/useISF';
import { ISFCard } from '../../components/ISFCard';
import { Semaphore } from '../../components/Semaphore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

function greeting(name: string): string {
  const hour = new Date().getHours();
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return `${saludo}, ${name.split(' ')[0]} 👋`;
}

function formattedDate(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function DashboardScreen() {
  const { session, signOut } = useAuthStore();
  const { profile, loading, refetch } = useProfile(session?.user?.id);
  const isfResult = useISF(profile ?? null);

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando tu salud financiera…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting(profile.full_name)}</Text>
            <Text style={styles.date}>{formattedDate()}</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.avatarButton}>
            <Text style={styles.avatarText}>
              {profile.full_name.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ISF Card */}
        {isfResult && (
          <ISFCard breakdown={isfResult.breakdown} />
        )}

        {/* Semaphore */}
        {isfResult && (
          <Semaphore data={isfResult.semaphore} />
        )}

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumen del mes</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>
                ${profile.monthly_income.toLocaleString('es-CO')}
              </Text>
              <Text style={styles.statLabel}>Ingreso</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>📉</Text>
              <Text style={styles.statValue}>
                ${(
                  profile.fixed_expenses +
                  profile.variable_expenses +
                  profile.leisure_expenses
                ).toLocaleString('es-CO')}
              </Text>
              <Text style={styles.statLabel}>Gastos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🏦</Text>
              <Text style={[styles.statValue, { color: Colors.green }]}>
                ${Math.max(
                  0,
                  profile.monthly_income -
                    profile.fixed_expenses -
                    profile.variable_expenses -
                    profile.leisure_expenses -
                    profile.monthly_debt_payment,
                ).toLocaleString('es-CO')}
              </Text>
              <Text style={styles.statLabel}>Potencial ahorro</Text>
            </View>
          </View>
        </View>

        {/* Meta de ahorro */}
        {profile.savings_goal > 0 && (
          <View style={styles.goalCard}>
            <Text style={styles.goalEmoji}>🎯</Text>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Tu meta de ahorro</Text>
              <Text style={styles.goalAmount}>
                ${profile.savings_goal.toLocaleString('es-CO')}
              </Text>
              {profile.savings_goal_months && (
                <Text style={styles.goalSub}>
                  en {profile.savings_goal_months} meses
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Próximas funciones */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>Próximamente en FlowCheck</Text>
          <Text style={styles.comingSoonItem}>📝  Registrar transacciones</Text>
          <Text style={styles.comingSoonItem}>🧠  Asesor antes de comprar</Text>
          <Text style={styles.comingSoonItem}>🏆  Recompensas por buenas decisiones</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  greeting: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  date: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },

  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  goalCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  goalEmoji: { fontSize: 32 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  goalAmount: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  goalSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  comingSoonCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  comingSoonItem: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
