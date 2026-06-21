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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile()
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile()
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile() {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user?.email) {
      setUser(null)
      setLoading(false)
      return
    }

    console.log('Buscando perfil por email:', user.email)

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', user.email)
      .maybesingle()

    console.log('Perfil encontrado:', data)
    console.log('Erro perfil:', error)

    if (error || !data) {
      setUser(null)
      setLoading(false)
      return
    }

    setUser({
      id: data.id,
      nome: data.nome,
      email: data.email,
      role: data.role as UserRole,
      foto_url: data.foto_url,
      telefone: data.telefone,
    })

    setLoading(false)
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
