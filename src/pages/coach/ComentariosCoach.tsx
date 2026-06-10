import { GlassCard } from '@/components/ui/GlassCard'
import { comentarios, getUsuarioById } from '@/data/seed'
import { MessageSquare, Send, User } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

export function ComentariosCoach() {
  const { user } = useAuth()
  const [mensagem, setMensagem] = useState('')

  function handleSend() {
    if (!mensagem.trim()) return
    comentarios.push({
      id: `com-${Date.now()}`,
      resultado_id: '',
      autor_id: user?.id || 'u-coach1',
      mensagem,
      lido: false,
      created_at: new Date().toISOString(),
    })
    setMensagem('')
    toast.success('Mensagem enviada!')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Comentarios</h1>
        <p className="text-sm text-text-secondary">Conversas com seus alunos</p>
      </div>

      <div className="space-y-3">
        {comentarios.map((c) => {
          const autor = getUsuarioById(c.autor_id)
          const isCoach = autor?.role === 'coach' || autor?.role === 'admin'
          return (
            <GlassCard key={c.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCoach ? 'bg-accent/15 text-accent' : 'bg-success/15 text-success'
                }`}>
                  {(autor?.nome || 'U').charAt(0)}
                </div>
                <span className="text-sm font-medium text-text-primary">{autor?.nome}</span>
                <span className="text-[10px] text-text-secondary ml-auto">
                  {c.created_at ? new Date(c.created_at).toLocaleString('pt-BR') : ''}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed pl-9">{c.mensagem}</p>
            </GlassCard>
          )
        })}
      </div>

      <div className="flex gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <input
          type="text"
          placeholder="Escrever mensagem para o aluno..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-secondary focus:outline-none"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
