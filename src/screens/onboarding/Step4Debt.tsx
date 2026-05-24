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
import { parseAmount, formatCOP } from '../../utils/formatters';
import type { OnboardingScreenProps } from '../../navigation/types';

export function Step4Debt({ navigation }: OnboardingScreenProps<'Step4'>) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [totalDebt, setTotalDebt] = useState(data.totalDebt);
  const [monthlyPayment, setMonthlyPayment] = useState(data.monthlyDebtPayment);
  const [emergencyFund, setEmergencyFund] = useState(data.emergencyFund);

  const income = parseAmount(data.monthlyIncome);
  const payment = parseAmount(monthlyPayment);
  const debtRatio = income > 0 ? (payment / income) * 100 : 0;

  const ratioColor =
    debtRatio < 20 ? Colors.green : debtRatio < 40 ? Colors.yellow : Colors.red;

  const handleNext = () => {
    updateData({
      totalDebt: totalDebt || '0',
      monthlyDebtPayment: monthlyPayment || '0',
      emergencyFund: emergencyFund || '0',
    });
    setStep(5);
    navigation.navigate('Step5');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ProgressBar currentStep={4} />

          <View style={styles.header}>
            <Text style={styles.emoji}>💳</Text>
            <Text style={styles.title}>¿Tienes alguna deuda?</Text>
            <Text style={styles.subtitle}>
              Sin juicios. Esta info nos ayuda a protegerte de comprometerte de más.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deuda total acumulada (COP)</Text>
              <Text style={styles.hint}>Créditos, tarjetas, préstamos. Pon 0 si no tienes.</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={totalDebt}
                  onChangeText={setTotalDebt}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pago mensual de deudas (COP)</Text>
              <Text style={styles.hint}>Cuota mensual total que destinas a pagar deudas.</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={monthlyPayment}
                  onChangeText={setMonthlyPayment}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              {income > 0 && payment > 0 && (
                <View style={[styles.ratioBadge, { backgroundColor: `${ratioColor}20` }]}>
                  <Text style={[styles.ratioText, { color: ratioColor }]}>
                    Ratio de deuda: {debtRatio.toFixed(1)}% del ingreso
                    {debtRatio < 20 ? ' ✓ Saludable' : debtRatio < 40 ? ' ⚠ Moderado' : ' ✗ Alto'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fondo de emergencia actual (COP)</Text>
              <Text style={styles.hint}>Dinero ahorrado para imprevistos. Puede ser $0.</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={emergencyFund}
                  onChangeText={setEmergencyFund}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Atrás"
            variant="ghost"
            onPress={() => { setStep(3); navigation.goBack(); }}
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
  ratioBadge: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  ratioText: { fontSize: FontSize.xs, fontWeight: '600' },
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
