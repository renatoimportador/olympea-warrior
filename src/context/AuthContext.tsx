import { type ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/data/types'

interface AuthUser {
  id: string
  nome: string
  email: string
  role: UserRole
  foto_url?: string
  telefone?: string
}

interface AuthContextData {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!mounted) return

      if (session?.user) {
        const profile = await fetchProfile()
        if (mounted) setUser(profile)
      } else {
        setUser(null)
      }

      if (mounted) setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)

        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            const profile = await fetchProfile()
            if (mounted) setUser(profile)
          } else {
            setUser(null)
          }
        }

        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(): Promise<AuthUser | null> {
    try {
      // Aguardar o usuário autenticado ficar disponível
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

      if (userError || !authUser?.email) {
        console.error('fetchProfile: auth user não disponível', userError)
        return null
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', authUser.email.toLowerCase())
        .maybeSingle()

      if (error) {
        console.error('fetchProfile: erro ao buscar usuarios', error)
        return null
      }

      if (!data) {
        console.error('fetchProfile: nenhum registro em public.usuarios para', authUser.email)
        return null
      }

      return {
        id: data.id,
        nome: data.nome,
        email: data.email,
        role: data.role as UserRole,
        foto_url: data.foto_url,
        telefone: data.telefone
      }
    } catch (err) {
      console.error('fetchProfile: erro inesperado', err)
      return null
    }
  }

  async function login(email: string, password: string): Promise<AuthUser | null> {
    const emailNorm = email.trim().toLowerCase()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password
    })

    if (signInError) throw signInError

    // Garantir que o profile seja carregado antes de retornar
    const profile = await fetchProfile()
    setUser(profile)
    setLoading(false)
    return profile
  }

  async function logout() {
    console.log('FAZENDO LOGOUT...')

    await supabase.auth.signOut({ scope: 'global' })

    localStorage.clear()
    sessionStorage.clear()

    setUser(null)
    setLoading(false)

    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
