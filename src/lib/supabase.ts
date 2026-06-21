import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error(
    'Variável de ambiente VITE_SUPABASE_URL não definida. Verifique o arquivo .env'
  )
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'Variável de ambiente VITE_SUPABASE_ANON_KEY não definida. Verifique o arquivo .env'
  )
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

export default supabase
