import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error('Variavel de ambiente VITE_SUPABASE_URL nao definida. Verifique o arquivo .env na raiz do projeto.')
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Variavel de ambiente VITE_SUPABASE_ANON_KEY nao definida. Verifique o arquivo .env na raiz do projeto.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
