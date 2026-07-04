import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { listarResultadosByAluno, getTreinoById, getAlunoByUsuarioId } from '@/lib/api'
import type { Resultado } from '@/data/types'
import { useAuth } from '@/context/AuthContext'
import { Calendar, Search, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export function Historico() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [treinosMap, setTreinosMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      setLoading(true)
      try {
        const aluno = await getAlunoByUsuarioId(user!.id)
        if (!aluno) { setLoading(false); return }

        const res = await listarResultadosByAluno(aluno.id)
        setResultados(res || [])

        // Buscar titulos dos treinos reais pelo Supabase
        const titulos: Record<string, string> = {}
        for (const r of (res || [])) {
          if (r.treino_id && !titulos[r.treino_id]) {
            try {
              const t = await getTreinoById(r.treino_id)
              titulos[r.treino_id] = t?.titulo || 'Treino'
            } catch {
              titulos[r.treino_id] = 'Treino'
            }
          }
        }
        setTreinosMap(titulos)
      } catch (e) {
        console.error('Erro ao carregar historico:', e)
        toast.error('Erro ao carregar historico')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase()
    return resultados.filter((r) => {
      const titulo = treinosMap[r.treino_id] || ''
      return (
        titulo.toLowerCase().includes(termo) ||
        (r.categoria || '').toLowerCase().includes(termo) ||
        (r.data || '').includes(termo)
      )
    })
  }, [resultados, treinosMap, busca])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Historico</h1>
        <p className="text-sm text-text-secondary">
          {resultados.length} resultados registrados
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input
          className="pl-9"
          placeholder="Buscar por treino, categoria ou data..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <GlassCard className="p-8 text-center">
            <Calendar size={32} className="mx-auto text-text-secondary mb-3" />
            <p className="text-sm text-text-secondary">Carregando historico...</p>
          </GlassCard>
        ) : filtrados.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Calendar size={32} className="mx-auto text-text-secondary mb-3" />
            <p className="text-sm text-text-secondary">Nenhum resultado encontrado.</p>
          </GlassCard>
        ) : (
          filtrados.map((r) => {
            const dataLabel = r.data ? new Date(r.data).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            }) : '-'
            return (
              <GlassCard key={r.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-text-secondary" />
                    <span className="text-xs text-text-secondary">{dataLabel}</span>
                  </div>
                  <Badge variant={r.categoria === 'RX' ? 'accent' : r.categoria === 'SCALING' ? 'warning' : 'success'}>
                    {r.categoria}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{treinosMap[r.treino_id] || 'Treino'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {r.tempo && (
                      <span className="text-xs text-accent font-medium">{r.tempo}</span>
                    )}
                    {r.rounds !== undefined && r.rounds > 0 && (
                      <span className="text-xs text-text-secondary">{r.rounds} rounds</span>
                    )}
                    {r.repeticoes !== undefined && r.repeticoes > 0 && (
                      <span className="text-xs text-text-secondary">{r.repeticoes} reps</span>
                    )}
                    {r.carga !== undefined && r.carga > 0 && (
                      <span className="text-xs text-text-secondary">{r.carga}kg</span>
                    )}
                    {r.rpe !== undefined && (
                      <span className="text-xs text-text-secondary">RPE {r.rpe}</span>
                    )}
                  </div>
                </div>
                {r.reflexao && (
                  <p className="text-xs text-text-secondary bg-white/[0.02] p-2 rounded-lg">
                    {r.reflexao}
                  </p>
                )}
                <div className="flex justify-end">
  <button
  onClick={() => navigate(`/aluno/resultado/${r.id}`)}
  className="flex items-center gap-2 text-accent hover:opacity-80 text-sm font-medium"
>
  <Eye size={16} />
  <span>Ver detalhes</span>
</button>
</div>
              </GlassCard>
            )
          })
        )}
      </div>
    </div>
  )
}
