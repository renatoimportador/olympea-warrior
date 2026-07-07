import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Medal, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  listarAlunos,
  listarResultadosByAluno,
} from '@/lib/api'
import { getTreinoDoDia, listarResultadosByTreino } from '@/lib/api'

export function RankingsCoach() {
  const [rankings, setRankings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [treinoHoje, setTreinoHoje] = useState<any>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const treinoHoje = await getTreinoDoDia()
        setTreinoHoje(treinoHoje)
        if (!treinoHoje) {
          setLoading(false)
          return
        }
        const resultadosHoje = await listarResultadosByTreino(treinoHoje.id)
        const alunosData = await listarAlunos()
        const alunosAtivos = (alunosData || []).filter(
          (a) => a.ativo
        )

        const rankingData = []

        for (const aluno of alunosAtivos) {
          const resultados = resultadosHoje.filter(
  (r: any) => r.aluno_id === aluno.id
)

          const resultado = resultados[0]

rankingData.push({
  id: aluno.id,
  nome: aluno.usuario?.nome || aluno.nome,
  categoria: aluno.categoria,
  resultado,
})
        }

        const rankingOrdenado = rankingData
          .sort((a: any, b: any) => {
  if (treinoHoje.tipo_wod === 'FOR_TIME') {
    return (a.resultado?.tempo || '').localeCompare(
      b.resultado?.tempo || ''
    )
  }

  if (treinoHoje.tipo_wod === 'AMRAP') {
    if ((b.resultado?.rounds || 0) !== (a.resultado?.rounds || 0)) {
      return (b.resultado?.rounds || 0) - (a.resultado?.rounds || 0)
    }

    return (b.resultado?.repeticoes || 0) - (a.resultado?.repeticoes || 0)
  }

  return (b.resultado?.carga || 0) - (a.resultado?.carga || 0)
})
          .map((r, index) => ({
            ...r,
            posicao: index + 1,
          }))

        setRankings(rankingOrdenado)
      } catch (error) {
        console.error('Erro ao carregar rankings:', error)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">
          Carregando rankings...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Rankings
        </h1>

        <p className="text-sm text-text-secondary">
          Visão geral dos rankings dos seus alunos
        </p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-warning" />
          Rankings Gerais
        </h3>

        <div className="space-y-2">
          {rankings.map((r) => (
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
                {r.posicao <= 3 ? (
                  <Medal size={16} />
                ) : (
                  r.posicao
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {r.nome}
                </p>

                <p className="text-xs text-text-secondary">
                  {r.resultado
  ? treinoHoje.tipo_wod === 'FOR_TIME'
    ? `Tempo: ${r.resultado.tempo}`
    : treinoHoje.tipo_wod === 'AMRAP'
    ? `${r.resultado.rounds} Rounds • ${r.resultado.repeticoes} Reps`
    : `${r.resultado.carga} kg`
  : 'Sem resultado'}
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
    {r.resultado
      ? treinoHoje?.tipo_wod === 'FOR_TIME'
        ? r.resultado.tempo
        : treinoHoje?.tipo_wod === 'AMRAP'
        ? `${r.resultado.rounds} R • ${r.resultado.repeticoes} Rep`
        : `${r.resultado.carga} kg`
      : '-'}
  </p>
</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
