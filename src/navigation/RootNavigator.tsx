import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { Step1Identity } from '../screens/onboarding/Step1Identity';
import { Step2Income } from '../screens/onboarding/Step2Income';
import { Step3Expenses } from '../screens/onboarding/Step3Expenses';
import { Step4Debt } from '../screens/onboarding/Step4Debt';
import { Step5Goals } from '../screens/onboarding/Step5Goals';
import { Step6RiskProfile } from '../screens/onboarding/Step6RiskProfile';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { Colors } from '../constants/theme';
import type {
  RootStackParamList,
  OnboardingStackParamList,
  AppStackParamList,
} from './types';

const Root = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Step1" component={Step1Identity} />
      <OnboardingStack.Screen name="Step2" component={Step2Income} />
      <OnboardingStack.Screen name="Step3" component={Step3Expenses} />
      <OnboardingStack.Screen name="Step4" component={Step4Debt} />
      <OnboardingStack.Screen name="Step5" component={Step5Goals} />
      <OnboardingStack.Screen name="Step6" component={Step6RiskProfile} />
    </OnboardingStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Dashboard" component={DashboardScreen} />
    </AppStack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

export function RootNavigator() {
  const { session, loading, setSession, setLoading } = useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Escuchar cambios de sesión de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Verificar si el onboarding está completo cuando hay sesión
  useEffect(() => {
    if (!session?.user) {
      setOnboardingComplete(null);
      return;
    }
    setOnboardingComplete(null); // reset mientras carga
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setOnboardingComplete(data?.onboarding_completed ?? false);
      });
  }, [session]);

  if (loading || (session && onboardingComplete === null)) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!session ? (
          <Root.Screen name="Auth" component={AuthScreen} />
        ) : !onboardingComplete ? (
          <Root.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Root.Screen name="App" component={AppNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
});
