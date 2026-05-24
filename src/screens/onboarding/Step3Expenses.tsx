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
import type { OnboardingScreenProps } from '../../navigation/types';

interface ExpenseInputProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}

function ExpenseInput({ label, hint, value, onChange }: ExpenseInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <View style={styles.currencyRow}>
        <Text style={styles.currencySign}>$</Text>
        <TextInput
          style={styles.currencyInput}
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}

export function Step3Expenses({ navigation }: OnboardingScreenProps<'Step3'>) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [fixed, setFixed] = useState(data.fixedExpenses);
  const [variable, setVariable] = useState(data.variableExpenses);
  const [leisure, setLeisure] = useState(data.leisureExpenses);

  const canContinue =
    parseFloat(fixed) >= 0 || parseFloat(variable) >= 0 || parseFloat(leisure) >= 0;

  const handleNext = () => {
    updateData({
      fixedExpenses: fixed || '0',
      variableExpenses: variable || '0',
      leisureExpenses: leisure || '0',
    });
    setStep(4);
    navigation.navigate('Step4');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ProgressBar currentStep={3} />

          <View style={styles.header}>
            <Text style={styles.emoji}>📊</Text>
            <Text style={styles.title}>¿En qué gastas tu dinero?</Text>
            <Text style={styles.subtitle}>
              Estima tus gastos mensuales. Si no estás seguro, aproxima.
            </Text>
          </View>

          <View style={styles.form}>
            <ExpenseInput
              label="Gastos fijos (COP)"
              hint="Arriendo, transporte mensual, suscripciones"
              value={fixed}
              onChange={setFixed}
            />
            <ExpenseInput
              label="Gastos variables (COP)"
              hint="Alimentación, mercado, salud, aseo personal"
              value={variable}
              onChange={setVariable}
            />
            <ExpenseInput
              label="Ocio y entretenimiento (COP)"
              hint="Salidas, streaming, ropa no esencial"
              value={leisure}
              onChange={setLeisure}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Atrás"
            variant="ghost"
            onPress={() => { setStep(2); navigation.goBack(); }}
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
