import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export function DefinirSenha() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // O Supabase detecta automaticamente os tokens da URL
    // via detectSessionInUrl: true (configurado no cliente)
    const checkSession = async () => {
      // Esperar um pouco para o Supabase processar os tokens da URL
      await new Promise((r) => setTimeout(r, 1000))

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      }
      setCheckingSession(false)
    }

    checkSession()

    // Listener para capturar o evento de recuperação de senha
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setSessionReady(true)
          setCheckingSession(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw error
      }

      toast.success('Senha definida com sucesso!')

      // Fazer logout para limpar a sessão de recuperação
      await supabase.auth.signOut()

      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      console.error('Erro ao definir senha:', err)
      toast.error(err?.message || 'Erro ao definir senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="glass-card p-8 text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-text-secondary">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="glass-card p-8 text-center space-y-4">
          <Lock size={32} className="mx-auto text-text-secondary" />
          <h1 className="text-xl font-bold text-text-primary">Link Expirado</h1>
          <p className="text-sm text-text-secondary">
            O link para definir a senha expirou ou é inválido.
            <br />
            Solicite um novo convite ao administrador ou utilize a recuperação de senha.
          </p>
          <button
            onClick={() => navigate('/recuperar-senha')}
            className="glass-button mx-auto"
          >
            Recuperar Senha
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-accent hover:underline block mx-auto"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <Lock size={32} className="mx-auto text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Definir Senha</h1>
          <p className="text-sm text-text-secondary">
            Crie uma senha para acessar o sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="glass-input w-full pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Confirmar Senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="glass-input w-full"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="glass-button w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Salvando...' : 'Definir Senha'}
          </button>
        </form>

        <p className="text-center text-xs text-text-secondary">
          Após definir a senha, você será redirecionado para o login.
        </p>
      </div>
    </div>
  )
}
