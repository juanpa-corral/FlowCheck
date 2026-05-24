import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { parseAmount } from '../../utils/formatters';
import type { OnboardingScreenProps } from '../../navigation/types';

export function Step5Goals({ navigation }: OnboardingScreenProps<'Step5'>) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [savingsGoal, setSavingsGoal] = useState(data.savingsGoal);
  const [months, setMonths] = useState(data.savingsGoalMonths);

  const goal = parseAmount(savingsGoal);
  const income = parseAmount(data.monthlyIncome);
  const totalExpenses =
    parseAmount(data.fixedExpenses) +
    parseAmount(data.variableExpenses) +
    parseAmount(data.leisureExpenses) +
    parseAmount(data.monthlyDebtPayment);
  const monthlySavingsCapacity = Math.max(0, income - totalExpenses);

  const monthsNeeded =
    goal > 0 && monthlySavingsCapacity > 0
      ? Math.ceil(goal / monthlySavingsCapacity)
      : null;

  const handleNext = () => {
    updateData({
      savingsGoal: savingsGoal || '0',
      savingsGoalMonths: months || '0',
    });
    setStep(6);
    navigation.navigate('Step6');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ProgressBar currentStep={5} />

          <View style={styles.header}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>¿Qué quieres lograr?</Text>
            <Text style={styles.subtitle}>
              Tener una meta clara hace que ahorrar sea más fácil y motivador.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Cuánto quieres ahorrar? (COP)</Text>
              <Text style={styles.hint}>
                Puede ser para un viaje, tu primer apartamento, un fondo de emergencia…
              </Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={savingsGoal}
                  onChangeText={setSavingsGoal}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {monthlySavingsCapacity > 0 && goal > 0 && monthsNeeded !== null && (
              <View style={styles.projectionCard}>
                <Text style={styles.projectionTitle}>Proyección personalizada</Text>
                <Text style={styles.projectionText}>
                  Con tu capacidad de ahorro actual (
                  <Text style={styles.projectionHighlight}>
                    ${monthlySavingsCapacity.toLocaleString('es-CO')} / mes
                  </Text>
                  ), alcanzarás tu meta en aproximadamente{' '}
                  <Text style={styles.projectionHighlight}>
                    {monthsNeeded} {monthsNeeded === 1 ? 'mes' : 'meses'}
                  </Text>
                  .
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿En cuántos meses quieres lograrlo?</Text>
              <Text style={styles.hint}>Opcional. Si no sabes, déjalo en blanco.</Text>
              <TextInput
                style={styles.input}
                value={months}
                onChangeText={(v) => setMonths(v.replace(/[^0-9]/g, ''))}
                placeholder="Ej: 12"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Atrás"
            variant="ghost"
            onPress={() => { setStep(4); navigation.goBack(); }}
            style={styles.backButton}
          />
          <Button label="Continuar" onPress={handleNext} style={styles.nextButton} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
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
  form: { gap: Spacing.lg },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  currencySign: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  currencyInput: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
  },
  projectionCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  projectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  projectionText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  projectionHighlight: { fontWeight: '700', color: Colors.primary },
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
