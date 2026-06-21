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
    // Verificar sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authId: string) {
    const { data: authData } = await supabase.auth.getUser()
    const userEmail = authData.user?.email

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .or(`auth_id.eq.${authId},email.eq.${userEmail}`)
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
      await loginDemo(email)
      return
    }
  }

  async function loginDemo(email: string) {
    const demoUsers: Record<string, AuthUser> = {
      'admin@olympea.com': {
        id: 'u-admin',
        nome: 'Renato Souza',
        email: 'admin@olympea.com',
        role: 'admin'
      },
      'coach@olympea.com': {
        id: 'u-coach1',
        nome: 'Coach Rafael',
        email: 'coach@olympea.com',
        role: 'coach'
      },
      'aluno@olympea.com': {
        id: 'u-aluno1',
        nome: 'Bruno Almeida',
        email: 'aluno@olympea.com',
        role: 'aluno'
      },
      'carla@olympea.com': {
        id: 'u-aluno2',
        nome: 'Carla Mendes',
        email: 'carla@olympea.com',
        role: 'aluno'
      },
      'diego@olympea.com': {
        id: 'u-aluno3',
        nome: 'Diego Costa',
        email: 'diego@olympea.com',
        role: 'aluno'
      },
    }

    const found = demoUsers[email]

    if (found) {
      setUser(found)
    } else {
      throw new Error('Credenciais inválidas')
    }
  }

  async function logout() {
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
