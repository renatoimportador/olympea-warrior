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
  const savedUser = localStorage.getItem('olympea_user')

  if (savedUser) {
    setUser(JSON.parse(savedUser))
    setLoading(false)
    return
  }
}, [])
  useEffect(() => {
    // Verificar sessao atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
  fetchProfile(session.user.id)
} else {
  const savedUser = localStorage.getItem('olympea_user')

  if (!savedUser) {
    setLoading(false)
  }
}
    })

    // Listener para mudancas de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
  const savedUser = localStorage.getItem('olympea_user')

  if (!savedUser) {
    setUser(null)
  }

  setLoading(false)
}
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authId: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authId)
      .single()

    if (data && !error) {
      setUser({
        id: data.id,
        nome: data.nome,
        email: data.email,
        role: data.role as UserRole,
        foto_url: data.foto_url,
        telefone: data.telefone,
      })
    }
    setLoading(false)
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Fallback para modo demo/seed enquanto nao ha usuarios no Auth
      await loginDemo(email)
      return
    }
  }

  async function loginDemo(email: string) {
    const demoUsers: Record<string, AuthUser> = {
      'admin@olympea.com': { id: 'u-admin', nome: 'Renato Souza', email: 'admin@olympea.com', role: 'head_coach' },
      'coach@olympea.com': { id: 'u-coach1', nome: 'Coach Rafael', email: 'coach@olympea.com', role: 'coach' },
      'aluno@olympea.com': { id: 'u-aluno1', nome: 'Bruno Almeida', email: 'aluno@olympea.com', role: 'aluno' },
      'carla@olympea.com': { id: 'u-aluno2', nome: 'Carla Mendes', email: 'carla@olympea.com', role: 'aluno' },
      'diego@olympea.com': { id: 'u-aluno3', nome: 'Diego Costa', email: 'diego@olympea.com', role: 'aluno' },
    }
    const found = demoUsers[email]
    if (found) {
  localStorage.setItem('olympea_user', JSON.stringify(found))
  setUser(found)
  return
} else {
      throw new Error('Credenciais invalidas')
    }
  }

  async function logout() {
  localStorage.removeItem('olympea_user')
  await supabase.auth.signOut()
  setUser(null)
}

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
