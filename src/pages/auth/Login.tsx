import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const demoAccounts = [
    { label: 'Head Coach', email: 'admin@olympea.com' },
    { label: 'Coach', email: 'coach@olympea.com' },
    { label: 'Aluno', email: 'aluno@olympea.com' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(email, password)
toast.success('Login realizado com sucesso')

setTimeout(() => {
  const savedUser = localStorage.getItem('olympea_user')

if (savedUser) {
  const user = JSON.parse(savedUser)

  if (user.role === 'head_coach') navigate('/admin/dashboard')
  else if (user.role === 'coach') navigate('/coach/dashboard')
  else navigate('/aluno/dashboard')
}
}, 300)
    } catch {
      toast.error('Credenciais invalidas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <img src="/assets/logo.png" alt="OLYMPEA Warrior" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-accent">OLYMPEA Warrior</h1>
          <p className="text-sm text-text-secondary">
            Sistema de treinamento esportivo
          </p>
        </div>

        {/* Form */}
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
        </form>

        {/* Demo accounts */}
        <div className="pt-4 border-t border-border-dark">
          <p className="text-xs text-text-secondary mb-3">Contas de demonstracao:</p>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => setEmail(acc.email)}
                className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-text-secondary hover:text-accent hover:border-accent/20 transition-all text-center"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary">
          Futuramente: Login Google, Login Apple
        </p>
      </div>
    </div>
  )
}
