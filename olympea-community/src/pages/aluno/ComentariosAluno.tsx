import { GlassCard } from '@/components/ui/GlassCard'
import { comentarios, getUsuarioById } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { MessageSquare, Send, User } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function ComentariosAluno() {
  const { user } = useAuth()
  const [mensagem, setMensagem] = useState('')

  const coms = comentarios.filter((c) => {
    const autor = getUsuarioById(c.autor_id)
    return autor?.role === 'aluno' || autor?.role === 'coach'
  })

  function handleSend() {
    if (!mensagem.trim()) return
    comentarios.push({
      id: `com-${Date.now()}`,
      resultado_id: '',
      autor_id: user?.id || 'u-aluno1',
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
        <p className="text-sm text-text-secondary">Conversa com seu coach</p>
      </div>

      <div className="space-y-3">
        {coms.length === 0 && (
          <GlassCard className="p-8 text-center">
            <MessageSquare size={32} className="mx-auto text-text-secondary mb-2" />
            <p className="text-sm text-text-secondary">Nenhum comentario ainda</p>
          </GlassCard>
        )}
        {coms.map((c) => {
          const autor = getUsuarioById(c.autor_id)
          const isCoach = autor?.role === 'coach' || autor?.role === 'admin'
          return (
            <GlassCard key={c.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  isCoach ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'
                }`}>
                  <User size={14} />
                </div>
                <span className="text-sm font-medium text-text-primary">{autor?.nome || 'Usuario'}</span>
                <span className="text-[10px] text-text-secondary ml-auto">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
              <p className="text-sm text-text-secondary">{c.mensagem}</p>
            </GlassCard>
          )
        })}
      </div>

      <div className="flex gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <input
          type="text"
          placeholder="Escrever comentario..."
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
