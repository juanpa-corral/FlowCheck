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
import type { OnboardingScreenProps } from '../../navigation/types';

const STRATA = [1, 2, 3, 4, 5, 6];

export function Step1Identity({ navigation }: OnboardingScreenProps<'Step1'>) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [fullName, setFullName] = useState(data.fullName);
  const [university, setUniversity] = useState(data.university);
  const [career, setCareer] = useState(data.career);
  const [stratum, setStratum] = useState<number | null>(data.stratum);

  const canContinue = fullName.trim().length > 1;

  const handleNext = () => {
    updateData({ fullName: fullName.trim(), university, career, stratum });
    setStep(2);
    navigation.navigate('Step2');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ProgressBar currentStep={1} />

          <View style={styles.header}>
            <Text style={styles.emoji}>👤</Text>
            <Text style={styles.title}>¡Hola! Cuéntanos sobre ti</Text>
            <Text style={styles.subtitle}>
              Necesitamos conocerte para darte consejos personalizados.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Cómo te llamas? *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Tu nombre completo"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿En qué universidad estudias?</Text>
              <TextInput
                style={styles.input}
                value={university}
                onChangeText={setUniversity}
                placeholder="Ej: Universidad Nacional"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Qué carrera cursas?</Text>
              <TextInput
                style={styles.input}
                value={career}
                onChangeText={setCareer}
                placeholder="Ej: Ingeniería de Sistemas"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Cuál es tu estrato socioeconómico?</Text>
              <View style={styles.stratumRow}>
                {STRATA.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.stratumChip,
                      stratum === s && styles.stratumChipActive,
                    ]}
                    onPress={() => setStratum(s === stratum ? null : s)}
                  >
                    <Text
                      style={[
                        styles.stratumLabel,
                        stratum === s && styles.stratumLabelActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Continuar"
            onPress={handleNext}
            disabled={!canContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
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
  form: { gap: Spacing.md },
  inputGroup: { gap: Spacing.xs },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
  },
  stratumRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stratumChip: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  stratumChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  stratumLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stratumLabelActive: {
    color: Colors.primary,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background,
  },
});
