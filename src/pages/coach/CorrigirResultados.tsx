import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import {
  getAlunoById,
  listarComentariosByResultado,
  criarComentario
} from '@/lib/api'
import { ClipboardCheck, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

export function CorrigirResultados() {
  const { user } = useAuth()
  const [resultados, setResultados] = useState<any[]>([])
  async function carregarResultados() {
    const { data, error } = await supabase
      .from('resultados')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('Erro ao carregar resultados')
      return
    }

    const enriquecidos = await Promise.all(
  (data || []).map(async (r) => {
    const aluno = await getAlunoById(r.aluno_id)
const usuario = aluno ? await getUsuarioById(aluno.usuario_id) : null
const comentarios = await listarComentariosByResultado(r.id)

return {
  ...r,
  usuario,
  comentarios
}
  })
)

setResultados(enriquecidos)
  }

  useEffect(() => {
  carregarResultados()
}, [])
  const [comentarioPorResultado, setComentarioPorResultado] = useState<Record<string, string>>({})

  async function handleAddComment(resultadoId: string) {
  const texto = (comentarioPorResultado[resultadoId] || '').trim()
  if (!texto) return

  await criarComentario({
    resultado_id: resultadoId,
    autor_id: user?.id,
    mensagem: texto,
    lido: false
  })

  setComentarioPorResultado((prev) => ({
    ...prev,
    [resultadoId]: ''
  }))

  toast.success('Comentário adicionado!')

  carregarResultados()
}

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Corrigir Resultados</h1>
        <p className="text-sm text-text-secondary">Avalie e comente os resultados dos alunos</p>
      </div>

      <div className="space-y-3">
        {resultados.length === 0 && (
          <GlassCard className="p-8 text-center">
            <ClipboardCheck size={32} className="mx-auto text-text-secondary mb-2" />
            <p className="text-sm text-text-secondary">Nenhum resultado registrado ainda.</p>
          </GlassCard>
        )}
        {resultados.map((r) => {
          const alunoUsuario = r.aluno?.usuario
const coms = r.comentarios || []
          return (
            <GlassCard key={r.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center font-bold text-accent text-sm">
                    {alunoUsuario?.nome?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{alunoUsuario?.nome || 'Aluno'}</p>
                    <p className="text-xs text-text-secondary">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <Badge variant="accent">{r.categoria}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                  <p className="text-sm font-bold text-accent">{r.tempo || '--'}</p>
                  <p className="text-[10px] text-text-secondary">Tempo</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                  <p className="text-sm font-bold text-warning">{r.rounds || '--'}</p>
                  <p className="text-[10px] text-text-secondary">Rounds</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                  <p className="text-sm font-bold text-success">{r.carga || '--'}kg</p>
                  <p className="text-[10px] text-text-secondary">Carga</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                  <p className="text-sm font-bold text-secondary">{r.rpe || '--'}</p>
                  <p className="text-[10px] text-text-secondary">RPE</p>
                </div>
              </div>

              {r.como_sentiu && (
                <p className="text-sm text-text-secondary bg-white/[0.02] p-3 rounded-lg">
                  <span className="text-text-primary font-medium">Reflexao: </span>{r.como_sentiu}
                </p>
              )}

              {r.meta_proximo && (
                <p className="text-sm text-text-secondary bg-white/[0.02] p-3 rounded-lg">
                  <span className="text-text-primary font-medium">Meta: </span>{r.meta_proximo}
                </p>
              )}

              {coms.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary">Comentarios anteriores</p>
                  {coms.map((c: any) => {
                    const autor = c.autor
                    return (
                      <div key={c.id} className="p-2 rounded-lg bg-white/[0.02] text-sm text-text-secondary">
                        <span className="text-accent font-medium">{autor?.nome || 'Coach'}:</span> {c.mensagem}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Adicionar observacao..."
                  value={comentarioPorResultado[r.id] || ''}
                  onChange={(e) => setComentarioPorResultado((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="glass-input flex-1 resize-none text-sm"
                />
                <button
                  onClick={() => handleAddComment(r.id)}
                  className="px-3 py-2 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare size={16} />
                  Comentar
                </button>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
