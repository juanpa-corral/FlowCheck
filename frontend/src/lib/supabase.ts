import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Faltan variables de entorno de Supabase.\n' +
    'Crea el archivo frontend/.env copiando frontend/.env.example y completa los valores.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
