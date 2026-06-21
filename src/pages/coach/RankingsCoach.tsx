import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Medal, ArrowUpRight } from 'lucide-react'

const rankings = [
  { posicao: 1, nome: 'Bruno Almeida', categoria: 'RX', pontos: 950, treinos: 5 },
  { posicao: 2, nome: 'Carla Mendes', categoria: 'SCALING', pontos: 920, treinos: 5 },
  { posicao: 3, nome: 'Diego Costa', categoria: 'RX', pontos: 890, treinos: 4 },
  { posicao: 4, nome: 'Ana Silva', categoria: 'BEGINNER', pontos: 860, treinos: 4 },
  { posicao: 5, nome: 'Pedro Santos', categoria: 'RX', pontos: 820, treinos: 3 },
]

export function RankingsCoach() {
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
          {rankings.map((r) => (
            <div key={r.posicao} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                r.posicao === 1 ? 'bg-warning/15 text-warning' :
                r.posicao === 2 ? 'bg-text-secondary/15 text-text-secondary' :
                r.posicao === 3 ? 'bg-orange-500/15 text-orange-500' :
                'bg-white/[0.03] text-text-secondary'
              }`}>
                {r.posicao <= 3 ? <Medal size={16} /> : r.posicao}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{r.nome}</p>
                <p className="text-xs text-text-secondary">{r.treinos} treinos</p>
              </div>
              <Badge variant={r.categoria === 'RX' ? 'accent' : r.categoria === 'SCALING' ? 'warning' : 'success'}>
                {r.categoria}
              </Badge>
              <ArrowUpRight size={14} className="text-success" />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
