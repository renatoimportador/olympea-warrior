import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await login(email, password)

      if (!user) {
        toast.error('Usuario autenticado, mas perfil nao encontrado.')
        return
      }

      toast.success('Login realizado com sucesso!')

      // Redirecionar imediatamente conforme a role
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user.role === 'coach') {
        navigate('/coach/dashboard', { replace: true })
      } else if (user.role === 'aluno') {
        navigate('/aluno/dashboard', { replace: true })
      } else {
        toast.error('Perfil nao reconhecido.')
      }
    } catch (err) {
      console.error('ERRO LOGIN:', err)
      toast.error('Credenciais invalidas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-transparent px-4 py-3.5 text-text-primary placeholder:text-text-secondary/70 outline-none border-b border-white/10"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-transparent px-4 py-3.5 pr-10 text-text-primary placeholder:text-text-secondary/70 outline-none"
              required
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

        <button
          type="submit"
          disabled={isLoading}
          className="glass-button w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/recuperar-senha')}
            className="text-sm text-white/80 hover:text-accent transition-colors drop-shadow-md"
          >
            Esqueceu a senha?
          </button>
        </div>
      </form>
    </div>
  )
}
