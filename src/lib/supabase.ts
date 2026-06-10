import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nxkkqeodbtowensijkqx.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_s1OldUf4HhO65GNI_TmcmQ_MR_0ApI5O'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
