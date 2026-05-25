// ============================================================
// profileStore — Fuente única de verdad para el perfil de usuario.
// Garantiza UN SOLO fetch y UNA SOLA suscripción Realtime
// sin importar cuántos componentes llamen a useProfile().
// ============================================================

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

// ── Tipos ─────────────────────────────────────────────────────

interface ProfileState {
  profile:  Profile | null
  loading:  boolean
  error:    string | null
  _userId:  string | null          // userId activo en el store
}

interface ProfileActions {
  /** Carga el perfil del usuario (NO-OP si el mismo userId ya está cargado) */
  init: (userId: string) => Promise<void>
  /** Fuerza una re-carga desde Supabase */
  refetch: () => Promise<void>
  /** Actualiza campos del perfil en DB y en el store */
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: unknown }>
  /** Actualiza directamente el estado local (usado por la suscripción Realtime) */
  _setProfile: (p: Profile | null) => void
}

export type ProfileStore = ProfileState & ProfileActions

// ── Store ─────────────────────────────────────────────────────

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  loading: true,
  error:   null,
  _userId: null,

  init: async (userId) => {
    const existing = get().profile
    // Solo usar caché si el perfil está completo (onboarding terminado).
    // Si onboarding_completed es false, siempre re-fetch para evitar el
    // redirect loop al volver de Step6RiskProfile.
    if (get()._userId === userId && existing !== null && existing.onboarding_completed) {
      set({ loading: false })
      return
    }
    set({ loading: true, _userId: userId, error: null })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ profile: data as Profile, loading: false })
    }
  },

  refetch: async () => {
    const { _userId } = get()
    if (!_userId) return
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', _userId)
      .single()
    if (!error && data) set({ profile: data as Profile, loading: false })
    else set({ loading: false })
  },

  updateProfile: async (patch) => {
    const { _userId } = get()
    if (!_userId) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', _userId)
      .select()
      .single()
    if (!error && data) set({ profile: data as Profile })
    return { error }
  },

  _setProfile: (profile) => set({ profile }),
}))

// ── Singleton de la suscripción Realtime ──────────────────────
// Se inicializa UNA VEZ desde App.tsx cuando hay sesión.
// Retorna una función de limpieza para cuando el usuario cierra sesión.

let _activeUserId: string | null = null

export function initProfileRealtime(userId: string): () => void {
  // Evitar duplicados si se llama más de una vez con el mismo userId
  if (_activeUserId === userId) return () => {}
  _activeUserId = userId

  const channel = supabase
    .channel(`profile-store:${userId}`)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'profiles',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        useProfileStore.getState()._setProfile(payload.new as Profile)
      },
    )
    .subscribe()

  return () => {
    _activeUserId = null
    supabase.removeChannel(channel)
  }
}
