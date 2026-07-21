import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useBox } from '@/context/BoxContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Medal } from 'lucide-react'
import { getAlunoByUsuarioId } from '@/lib/api'
import { carregarRankingDoDia, formatarResultadoRanking } from '@/lib/ranking'
import type { RankingItem } from '@/lib/ranking'

export function RankingsAluno() {
  const { user } = useAuth()
  const { box } = useBox()
  const [treinoHoje, setTreinoHoje] = useState<any>(null)
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [meuAlunoId, setMeuAlunoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Buscar meu aluno_id
        if (user?.id) {
          const meuAluno = await getAlunoByUsuarioId(user.id)
          if (meuAluno) setMeuAlunoId(meuAluno.id)
        }

        const { treino, ranking } = await carregarRankingDoDia(box?.id)
        setTreinoHoje(treino)
        setRankings(ranking)
      } catch (err) {
        console.error('Erro ao carregar rankings:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, box])

  const minhaPosicao = rankings.find((r) => r.id === meuAlunoId)

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-text-secondary">Carregando rankings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Rankings</h1>
        <p className="text-sm text-text-secondary">
          {treinoHoje
            ? `Ranking do treino: ${treinoHoje.titulo || treinoHoje.tipo_wod || 'Hoje'}`
            : 'Veja sua posicao e compare com outros atletas'}
        </p>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {rankings.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-text-secondary">
              Nenhum resultado registrado para o treino de hoje.
            </p>
          </GlassCard>
        ) : (
          rankings.map((r) => (
            <GlassCard
              key={r.id}
              className={`p-4 flex items-center gap-4 ${
                r.id === meuAlunoId ? 'border border-accent bg-accent/5' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                r.posicao === 1 ? 'bg-warning/15 text-warning' :
                r.posicao === 2 ? 'bg-text-secondary/15 text-text-secondary' :
                r.posicao === 3 ? 'bg-orange-500/15 text-orange-500' :
                'bg-white/[0.03] text-text-secondary'
              }`}>
                {r.posicao <= 3 ? <Medal size={16} /> : r.posicao}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {r.nome}
                  {r.id === meuAlunoId && (
                    <span className="ml-2 text-xs text-accent">(Voce)</span>
                  )}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatarResultadoRanking(r.resultado, treinoHoje?.tipo_wod)}
                </p>
              </div>
              <Badge
                variant={
                  r.categoria === 'RX'
                    ? 'accent'
                    : r.categoria === 'SCALING'
                    ? 'warning'
                    : 'success'
                }
              >
                {r.categoria}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">
                  {formatarResultadoRanking(r.resultado, treinoHoje?.tipo_wod)}
                </p>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Destaque */}
      {minhaPosicao && (
        <GlassCard className="p-5 text-center space-y-2">
          <Trophy size={28} className="mx-auto text-warning" />
          <p className="text-lg font-bold text-text-primary">
            Voce esta em {minhaPosicao.posicao}o lugar!
          </p>
          <p className="text-sm text-text-secondary">
            Ranking geral
          </p>
          <p className="text-xs text-accent">
            {formatarResultadoRanking(minhaPosicao.resultado, treinoHoje?.tipo_wod)}
          </p>
        </GlassCard>
      )}
    </div>
  )
}
