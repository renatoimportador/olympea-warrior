import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { MessageSquare, Send, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  getAlunoByUsuarioId,
  listarComentariosByAluno,
  adicionarComentario,
} from '@/lib/api'

export function ComentariosAluno() {
  const { user } = useAuth()

  const [mensagem, setMensagem] = useState('')
  const [comentarios, setComentarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [alunoId, setAlunoId] = useState<string | null>(null)

  useEffect(() => {
    carregarComentarios()
  }, [])

  async function carregarComentarios() {
    try {
      if (!user?.id) return

      const aluno = await getAlunoByUsuarioId(user.id)

      if (!aluno) {
        setComentarios([])
        return
      }

      setAlunoId(aluno.id)

      const comentarios = await listarComentariosByAluno(aluno.id)
      setComentarios(comentarios || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar comentarios')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!mensagem.trim()) return

    try {
      if (!user?.id || !alunoId) {
        toast.error('Aluno nao encontrado')
        return
      }

      await adicionarComentario({
        aluno_id: alunoId,
        resultado_id: null,
        autor_id: user.id,
        mensagem,
        lido: false,
      })

      setMensagem('')
      toast.success('Mensagem enviada!')

      await carregarComentarios()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar comentario')
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">
          Carregando comentarios...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Comentarios
        </h1>

        <p className="text-sm text-text-secondary">
          Conversa com seu coach
        </p>
      </div>

      <div className="space-y-3">
        {comentarios.length === 0 && (
          <GlassCard className="p-8 text-center">
            <MessageSquare
              size={32}
              className="mx-auto text-text-secondary mb-2"
            />
            <p className="text-sm text-text-secondary">
              Nenhum comentario ainda
            </p>
          </GlassCard>
        )}

        {comentarios.map((c) => {
          const isCoach = c.autor_id !== user?.id

          return (
            <GlassCard key={c.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isCoach
                      ? 'bg-accent/10 text-accent'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  <User size={14} />
                </div>

                <span className="text-sm font-medium text-text-primary">
                  {isCoach ? 'Coach' : 'Voce'}
                </span>

                <span className="text-[10px] text-text-secondary ml-auto">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleString('pt-BR')
                    : ''}
                </span>
              </div>

              <p className="text-sm text-text-secondary">
                {c.mensagem}
              </p>
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
