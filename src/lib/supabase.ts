import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Profile, Budget, Transaction } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ---- Helpers de acceso tipado (cast explícito al hacer .select()) ----
// Usar como: supabase.from('profiles').select('*') y castear al tipo Profile

export const DB = {
  profiles: 'profiles',
  budgets: 'budgets',
  transactions: 'transactions',
} as const;
