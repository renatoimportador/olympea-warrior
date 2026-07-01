import { GlassCard } from '@/components/ui/GlassCard'
import { Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import {
  listarComentarios,
  listarUsuarios,
  adicionarComentario,
} from '@/lib/api'

export function ComentariosCoach() {
  const { user } = useAuth()

  const [mensagem, setMensagem] = useState('')
  const [comentarios, setComentarios] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const [comentariosData, usuariosData] = await Promise.all([
          listarComentarios(),
          listarUsuarios(),
        ])

        setComentarios(comentariosData || [])
        setUsuarios(usuariosData || [])
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar comentários')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  async function handleSend() {
    if (!mensagem.trim()) return

    try {
      const novoComentario = await adicionarComentario({
        resultado_id: null,
        autor_id: user?.id,
        mensagem,
        lido: false,
      } as any)

      setComentarios((prev) => [...prev, novoComentario])

      setMensagem('')
      toast.success('Mensagem enviada!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar mensagem')
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">Carregando comentários...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Comentários</h1>
        <p className="text-sm text-text-secondary">
          Conversas com seus alunos
        </p>
      </div>

      <div className="space-y-3">
        {comentarios.map((c) => {
          const autor = usuarios.find((u) => u.id === c.autor_id)
          const isCoach =
            autor?.role === 'coach' || autor?.role === 'admin'

          return (
            <GlassCard key={c.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCoach
                      ? 'bg-accent/15 text-accent'
                      : 'bg-success/15 text-success'
                  }`}
                >
                  {(autor?.nome || 'U').charAt(0)}
                </div>

                <span className="text-sm font-medium text-text-primary">
                  {autor?.nome || 'Usuário'}
                </span>

                <span className="text-[10px] text-text-secondary ml-auto">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleString('pt-BR')
                    : ''}
                </span>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed pl-9">
                {c.mensagem}
              </p>
            </GlassCard>
          )
        })}
      </div>

      <div className="flex gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <input
          type="text"
          placeholder="Escrever mensagem..."
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
