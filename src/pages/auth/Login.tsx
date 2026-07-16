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
      await login(email, password)
      toast.success('Login realizado com sucesso!')
    } catch (err) {
      console.error('ERRO LOGIN:', err)
      toast.error('Credenciais invalidas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card p-8 space-y-6">

        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <img
              src="/assets/logo.png"
              alt="OLYMPEA Warrior"
              className="w-20 h-20 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-gradient-accent">
            OLYMPEA Warrior
          </h1>

          <p className="text-sm text-text-secondary">
            Sistema de treinamento esportivo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="glass-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Senha
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="glass-input w-full pr-10"
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
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
