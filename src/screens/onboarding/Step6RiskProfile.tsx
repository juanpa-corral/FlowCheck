import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { calculateISF } from '../../hooks/useISF';
import { parseAmount } from '../../utils/formatters';
import type { RiskProfile, Profile } from '../../types/database';
import type { OnboardingScreenProps } from '../../navigation/types';

interface ProfileCard {
  key: RiskProfile;
  emoji: string;
  title: string;
  description: string;
  traits: string[];
}

const PROFILES: ProfileCard[] = [
  {
    key: 'conservador',
    emoji: '🛡️',
    title: 'Conservador',
    description: 'Prefiero la seguridad. Prefiero ganar menos si eso significa dormir tranquilo.',
    traits: ['Ahorro en productos de bajo riesgo', 'Evita endeudarse', 'Prioriza el fondo de emergencia'],
  },
  {
    key: 'moderado',
    emoji: '⚖️',
    title: 'Moderado',
    description: 'Busco un balance. Acepto algo de riesgo si hay posibilidad de mayor crecimiento.',
    traits: ['Mezcla ahorro e inversión', 'Acepta deuda estratégica', 'Metas a mediano plazo'],
  },
  {
    key: 'arriesgado',
    emoji: '🚀',
    title: 'Arriesgado',
    description: 'Acepto más volatilidad. Me motivan las oportunidades de alto crecimiento.',
    traits: ['Invierte en opciones de mayor riesgo', 'Usa apalancamiento con criterio', 'Metas ambiciosas'],
  },
];

export function Step6RiskProfile({ navigation }: OnboardingScreenProps<'Step6'>) {
  const { data, updateData, setStep, reset } = useOnboardingStore();
  const { session } = useAuthStore();
  const [selected, setSelected] = useState<RiskProfile | null>(data.riskProfile);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!selected || !session?.user) return;
    setSaving(true);

    const profileData: Partial<Profile> = {
      full_name: data.fullName,
      university: data.university || null,
      career: data.career || null,
      stratum: data.stratum,
      monthly_income: parseAmount(data.monthlyIncome),
      income_sources: data.incomeSources.length ? data.incomeSources : null,
      fixed_expenses: parseAmount(data.fixedExpenses),
      variable_expenses: parseAmount(data.variableExpenses),
      leisure_expenses: parseAmount(data.leisureExpenses),
      total_debt: parseAmount(data.totalDebt),
      monthly_debt_payment: parseAmount(data.monthlyDebtPayment),
      emergency_fund: parseAmount(data.emergencyFund),
      savings_goal: parseAmount(data.savingsGoal),
      savings_goal_months: parseInt(data.savingsGoalMonths) || null,
      risk_profile: selected,
      onboarding_completed: true,
    };

    // Calcular ISF con los datos recopilados
    const isfBreakdown = calculateISF(profileData as Profile);
    profileData.isf_score = isfBreakdown.total;

    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', session.user.id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'No pudimos guardar tu perfil. Intenta de nuevo.');
      return;
    }

    reset();
    // RootNavigator detectará onboarding_completed = true y navegará al Dashboard
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ProgressBar currentStep={6} />

        <View style={styles.header}>
          <Text style={styles.emoji}>🧠</Text>
          <Text style={styles.title}>¿Cuál es tu estilo financiero?</Text>
          <Text style={styles.subtitle}>
            No hay una respuesta correcta. Elige la que más resuene contigo hoy.
          </Text>
        </View>

        <View style={styles.cards}>
          {PROFILES.map((profile) => {
            const isSelected = selected === profile.key;
            return (
              <TouchableOpacity
                key={profile.key}
                style={[styles.card, isSelected && styles.cardActive]}
                onPress={() => setSelected(profile.key)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{profile.emoji}</Text>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                      {profile.title}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.cardDescription}>{profile.description}</Text>
                <View style={styles.traitList}>
                  {profile.traits.map((trait) => (
                    <Text key={trait} style={styles.trait}>
                      • {trait}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Atrás"
          variant="ghost"
          onPress={() => { setStep(5); navigation.goBack(); }}
          style={styles.backButton}
        />
        <Button
          label={saving ? 'Guardando...' : '¡Empecemos!'}
          onPress={handleFinish}
          disabled={!selected || saving}
          loading={saving}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xl },
  header: { alignItems: 'center', marginVertical: Spacing.xl },
  emoji: { fontSize: 40, marginBottom: Spacing.sm },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cards: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  cardEmoji: { fontSize: 28, marginRight: Spacing.sm },
  cardTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  cardTitleActive: { color: Colors.primary },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '800' },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  traitList: { gap: 4 },
  trait: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
});
