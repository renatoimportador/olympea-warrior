import { useBox } from '@/context/BoxContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Medal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { carregarRankingDoDia, formatarResultadoRanking } from '@/lib/ranking'
import type { RankingItem } from '@/lib/ranking'

export function RankingsCoach() {
  const { box } = useBox()
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [treinoHoje, setTreinoHoje] = useState<any>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const { treino, ranking } = await carregarRankingDoDia(box?.id)
        setTreinoHoje(treino)
        setRankings(ranking)
      } catch (error) {
        console.error('Erro ao carregar rankings:', error)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [box])

  if (loading) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">Carregando rankings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Rankings</h1>
        <p className="text-sm text-text-secondary">Visao geral dos rankings dos seus alunos</p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-warning" />
          Rankings Gerais
        </h3>

        <div className="space-y-2">
          {rankings.length === 0 ? (
            <div className="py-8 text-center text-text-secondary">
              Ainda nao ha resultados registrados para o treino de hoje.
            </div>
          ) : (
            rankings.map((r) => (
              <div
                key={r.posicao}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    r.posicao === 1
                      ? 'bg-warning/15 text-warning'
                      : r.posicao === 2
                      ? 'bg-text-secondary/15 text-text-secondary'
                      : r.posicao === 3
                      ? 'bg-orange-500/15 text-orange-500'
                      : 'bg-white/[0.03] text-text-secondary'
                  }`}
                >
                  {r.posicao <= 3 ? <Medal size={16} /> : r.posicao}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{r.nome}</p>
                  <p className="text-xs text-text-secondary">{r.categoria}</p>
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
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  )
}
