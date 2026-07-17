import { useState, useEffect, useRef } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import {
  listarAlunos,
  listarComentariosByAluno,
  adicionarComentario,
  criarNotificacaoSupabase,
} from '@/lib/api'
import { MessageSquare, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export function ComentariosCoach() {
  const { user } = useAuth()
  const [alunos, setAlunos] = useState<any[]>([])
  const [selectedAluno, setSelectedAluno] = useState<string>('')
  const [mensagens, setMensagens] = useState<any[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarAlunos()
        const ativos = (data || []).filter((a: any) => a.ativo)
        setAlunos(ativos)
        if (ativos.length > 0) {
          setSelectedAluno(ativos[0].id)
        }
      } catch (e) {
        console.error('Erro ao carregar alunos:', e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  useEffect(() => {
    if (!selectedAluno) return
    carregarMensagens()
  }, [selectedAluno])

  async function carregarMensagens() {
    if (!selectedAluno) return

    // Limpa mensagens anteriores imediatamente ao trocar de aluno
    setMensagens([])

    try {
      const data = await listarComentariosByAluno(selectedAluno)
      setMensagens(data || [])

      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
      }, 100)
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e)
    }
  }

  async function handleEnviar() {
    if (!novaMensagem.trim() || !user || !selectedAluno) return

    setEnviando(true)

    try {
      const data = await adicionarComentario({
        aluno_id: selectedAluno,
        resultado_id: null,
        autor_id: user.id,
        mensagem: novaMensagem.trim(),
        lido: false,
      })

      setMensagens((prev) => [...prev, { ...data, autor: { nome: user.nome } }])
      setNovaMensagem('')

      // Notificar o usuario dono do aluno selecionado
      const alunoSelecionado = alunos.find((a: any) => a.id === selectedAluno)
      const usuarioId = alunoSelecionado?.usuario_id

      if (usuarioId) {
        await criarNotificacaoSupabase({
          usuario_id: usuarioId,
          tipo: 'MENSAGEM_COACH',
          titulo: 'Nova mensagem do Coach',
          mensagem: novaMensagem.trim().substring(0, 100),
          link: '/aluno/comentarios',
          data: new Date().toISOString(),
        })
      }

      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
      }, 100)
    } catch (e: any) {
      console.error('Erro ao enviar:', e)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setEnviando(false)
    }
  }

  const alunoSelecionado = alunos.find((a: any) => a.id === selectedAluno)

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Comentarios</h1>
        <p className="text-sm text-text-secondary">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Comentarios</h1>
        <p className="text-sm text-text-secondary">Conversa individual por aluno</p>
      </div>

      <select
        value={selectedAluno}
        onChange={(e) => setSelectedAluno(e.target.value)}
        className="glass-input w-full"
      >
        {alunos.map((a: any) => (
          <option key={a.id} value={a.id}>
            {a.usuario?.nome || 'Aluno'}
          </option>
        ))}
      </select>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/[0.05] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <MessageSquare size={14} className="text-accent" />
          </div>
          <span className="text-sm font-medium text-text-primary">
            {alunoSelecionado?.usuario?.nome || 'Selecione um aluno'}
          </span>
        </div>

        <div ref={chatRef} className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {mensagens.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">
              Nenhuma mensagem ainda. Inicie a conversa!
            </p>
          ) : (
            mensagens.map((m: any) => {
              const isCoach = m.autor_id === user?.id
              return (
                <div key={m.id} className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${
                    isCoach
                      ? 'bg-accent/10 border border-accent/20'
                      : 'bg-white/[0.03] border border-white/[0.05]'
                  }`}>
                    <p className="text-[10px] text-text-secondary mb-1">
                      {m.autor?.nome || (isCoach ? 'Voce' : 'Aluno')}
                    </p>
                    <p className="text-sm text-text-primary">{m.mensagem}</p>
                    <p className="text-[10px] text-text-secondary mt-1">
                      {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-white/[0.05] flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
            className="flex-1"
          />
          <Button onClick={handleEnviar} disabled={enviando || !novaMensagem.trim() || !selectedAluno}>
            <Send size={16} />
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
