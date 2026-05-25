import { useMemo } from 'react'
import type { Profile } from '../types/database'
import { calculateSemaphore } from './useISF'
import { getContextualLessons, LESSONS_CATALOG, type Lesson } from '../data/lessons'

/**
 * Hook que evalúa el perfil financiero del usuario y retorna:
 * - contextualLessons: lecciones relevantes según situación actual (máx 3)
 * - allLessons: catálogo completo para la página de Educación
 */
export function useLessons(profile: Profile | null): {
  contextualLessons: Lesson[]
  allLessons: Lesson[]
} {
  return useMemo(() => {
    if (!profile) return { contextualLessons: [], allLessons: LESSONS_CATALOG }

    const semaphore = calculateSemaphore(profile)
    const contextualLessons = getContextualLessons(profile, semaphore, 3)

    return {
      contextualLessons,
      allLessons: LESSONS_CATALOG,
    }
  }, [profile])
}
