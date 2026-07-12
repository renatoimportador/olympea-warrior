import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.renatoimportador.com.br'

export function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const emailNorm = email.trim().toLowerCase()
    if (!emailNorm) {
      toast.error('Informe o e-mail')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailNorm, {
        redirectTo: `${APP_URL}/definir-senha`
      })

      if (error) {
        console.error('Erro ao enviar recuperação:', error)
      }

      // Mensagem genérica para não revelar se o e-mail existe
      setEnviado(true)
    } catch (err) {
      console.error('Erro ao enviar recuperação:', err)
      setEnviado(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="glass-card p-8 text-center space-y-4">
          <Mail size={32} className="mx-auto text-accent" />
          <h1 className="text-xl font-bold text-text-primary">Verifique seu E-mail</h1>
          <p className="text-sm text-text-secondary">
            Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha.
            <br /><br />
            Verifique também a caixa de spam.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="glass-button mx-auto"
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
          <Mail size={32} className="mx-auto text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Recuperar Senha</h1>
          <p className="text-sm text-text-secondary">
            Informe seu e-mail para receber o link de recuperação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              E-mail
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

          <button
            type="submit"
            disabled={isLoading}
            className="glass-button w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent mx-auto"
        >
          <ArrowLeft size={14} />
          Voltar ao Login
        </button>
      </div>
    </div>
  )
}
