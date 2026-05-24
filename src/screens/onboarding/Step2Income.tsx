import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { INCOME_SOURCE_LABELS } from '../../utils/formatters';
import type { IncomeSource } from '../../types/database';
import type { OnboardingScreenProps } from '../../navigation/types';

const SOURCES: IncomeSource[] = [
  'beca',
  'trabajo_parcial',
  'apoyo_familiar',
  'freelance',
  'otro',
];

export function Step2Income({ navigation }: OnboardingScreenProps<'Step2'>) {
  const { data, updateData, toggleIncomeSource, setStep } = useOnboardingStore();
  const [income, setIncome] = useState(data.monthlyIncome);

  const canContinue = parseFloat(income) > 0;

  const handleNext = () => {
    updateData({ monthlyIncome: income });
    setStep(3);
    navigation.navigate('Step3');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ProgressBar currentStep={2} />

          <View style={styles.header}>
            <Text style={styles.emoji}>💰</Text>
            <Text style={styles.title}>¿Cuánto entra cada mes?</Text>
            <Text style={styles.subtitle}>
              Incluye todo: beca, mesada, trabajo, etc. Sin juicios.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ingreso mensual total (COP) *</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={income}
                  onChangeText={setIncome}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.hint}>
                Si varía mes a mes, usa tu promedio de los últimos 3 meses.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿De dónde viene? (selecciona todo lo que aplique)</Text>
              <View style={styles.chipGrid}>
                {SOURCES.map((source) => {
                  const active = data.incomeSources.includes(source);
                  return (
                    <TouchableOpacity
                      key={source}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleIncomeSource(source)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {INCOME_SOURCE_LABELS[source]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Atrás"
            variant="ghost"
            onPress={() => { setStep(1); navigation.goBack(); }}
            style={styles.backButton}
          />
          <Button
            label="Continuar"
            onPress={handleNext}
            disabled={!canContinue}
            style={styles.nextButton}
          />
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
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  currencySign: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  currencyInput: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
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
