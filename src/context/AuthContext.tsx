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
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessao atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
      } else {
        setLoading(false)
      }
    })

    // Listener para mudancas de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
      } else {
        setUser(null)
        localStorage.removeItem('olympea_user')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authId: string, email?: string) {
    // Tenta buscar pelo auth_id (UUID do Supabase Auth)
    let { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authId)
      .single()

    // Fallback: se nao encontrou por auth_id, busca pelo email
    if ((!data || error) && email) {
      const res = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      data = res.data
      error = res.error
    }

    if (error || !data) {
      console.error('Erro ao buscar perfil:', error)
      setUser(null)
      setLoading(false)
      return
    }

    const profile: AuthUser = {
      id: data.id,
      nome: data.nome,
      email: data.email,
      role: data.role as UserRole,
      foto_url: data.foto_url,
      telefone: data.telefone,
    }

    localStorage.setItem('olympea_user', JSON.stringify(profile))
    setUser(profile)
    setLoading(false)
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
    // Sucesso: onAuthStateChange dispara fetchProfile automaticamente
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('olympea_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
