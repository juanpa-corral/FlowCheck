// ============================================================
// useProfile — thin wrapper alrededor de useProfileStore.
// Mantiene la API existente (useProfile(userId)) para que todos
// los componentes funcionen sin cambios.
// El fetch real y la suscripción Realtime viven en profileStore.
// ============================================================

import { useEffect } from 'react'
import { useProfileStore } from '../stores/profileStore'

/**
 * useProfile(userId)
 * ─────────────────
 * • Llama a store.init(userId) para cargar el perfil si aún no está.
 * • Retorna { profile, loading, error, refetch, updateProfile } del store.
 * • NO crea ninguna suscripción Realtime; eso lo hace initProfileRealtime()
 *   una sola vez desde AuthenticatedShell (App.tsx).
 */
export function useProfile(userId: string | undefined) {
  const store = useProfileStore()

  useEffect(() => {
    if (userId) store.init(userId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return {
    profile:       store.profile,
    loading:       store.loading,
    error:         store.error,
    refetch:       store.refetch,
    updateProfile: store.updateProfile,
  }
}
