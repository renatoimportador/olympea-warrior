import type { BlocoTreino } from '@/data/types'
import { getTipoBlocoLabel } from '@/lib/api'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Move, Flame, Star, Zap, Dumbbell, Target, MessageCircle, Youtube, Plus, Heart } from 'lucide-react'

const iconMap = { Move, Flame, Star, Zap, Dumbbell, Target, MessageCircle, Youtube, Plus, Heart }

const tipoParaIcone: Record<string, string> = {
  MOBILIDADE: 'Move',
  WARM_UP: 'Flame',
  SKILL: 'Star',
  FORCA: 'Zap',
  WORKOUT: 'Dumbbell',
  GAME_PLAN: 'Target',
  OBSERVACOES_COACH: 'MessageCircle',
  ACCESSORIES: 'Plus',
  CONDITIONING: 'Flame',
}

function BlocoHeader({ tipo, titulo }: { tipo: string; titulo: string }) {
  const label = getTipoBlocoLabel(tipo)
  const iconName = tipoParaIcone[tipo] || 'Move'
  const Icon = (iconMap as any)[iconName] || Move

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon size={16} className="text-accent" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{titulo}</h3>
        <p className="text-[10px] text-text-secondary uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}

function ExerciciosList({ exercicios }: { exercicios: BlocoTreino['exercicios'] }) {
  if (!exercicios.length) return null
  return (
    <div className="space-y-2 mt-2">
      {exercicios.map((e, i) => (
        <div key={e.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
          <span className="text-xs font-bold text-accent mt-0.5">{i + 1}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">{e.nome}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {e.series && <Badge variant="default">{e.series} series</Badge>}
              {e.repeticoes && <Badge variant="default">{e.repeticoes} reps</Badge>}
              {e.carga && <Badge variant="accent">{e.carga}</Badge>}
              {e.percentual && <Badge variant="warning">{e.percentual}</Badge>}
              {e.tempo_descanso && <Badge variant="default">{e.tempo_descanso} descanso</Badge>}
            </div>
            {e.observacoes && <p className="text-xs text-text-secondary mt-1">{e.observacoes}</p>}
          </div>
          {e.link_youtube && (
            <a href={e.link_youtube} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-accent/10 text-error transition-colors">
              <Youtube size={14} />
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

interface BlocoViewerProps {
  blocos: BlocoTreino[]
  wod?: { tipo: string; nome?: string; descricao: string; time_cap?: string }
}

export function BlocoViewer({ blocos, wod: wodProp }: BlocoViewerProps) {
  const ordenados = blocos.sort((a, b) => a.ordem - b.ordem)
  const wodBloco = ordenados.find(b => b.tipo === 'WORKOUT')
  const wod = wodProp || (wodBloco ? { tipo: 'WOD', nome: wodBloco.titulo || 'Workout (WOD)', descricao: wodBloco.descricao || '', time_cap: wodBloco.observacoes } : undefined)
  const gamePlan = ordenados.find(b => b.tipo === 'GAME_PLAN')
  const obsCoach = ordenados.find(b => b.tipo === 'OBSERVACOES_COACH')
  const outros = ordenados.filter(b => !['WORKOUT', 'GAME_PLAN', 'OBSERVACOES_COACH'].includes(b.tipo))

  return (
    <div className="space-y-4">
      {outros.map(b => (
        <GlassCard key={b.id} className="p-5">
          <BlocoHeader tipo={b.tipo} titulo={b.titulo} />
          {b.descricao && <p className="text-sm text-text-secondary mb-3 whitespace-pre-wrap">{b.descricao}</p>}
          <ExerciciosList exercicios={b.exercicios} />
          {b.link_youtube && (
            <a href={b.link_youtube} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 mt-3 text-xs text-error hover:text-red-400 transition-colors">
              <Youtube size={12} /> Video do YouTube
            </a>
          )}
        </GlassCard>
      ))}

      {wod && (
        <GlassCard className="p-5 bg-gradient-to-br from-accent/[0.04] to-transparent border-accent/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Dumbbell size={16} className="text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{wod.nome || 'Workout (WOD)'}</h3>
                <p className="text-[10px] text-accent uppercase tracking-wider font-medium">{wod.tipo}</p>
              </div>
            </div>
            {wod.time_cap && (
              <Badge variant="accent">Time Cap: {wod.time_cap}</Badge>
            )}
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{wod.descricao}</p>
        </GlassCard>
      )}

      {gamePlan && gamePlan.tipo === 'GAME_PLAN' && (
        <GlassCard className="p-5">
          <BlocoHeader tipo="GAME_PLAN" titulo={gamePlan.titulo || 'Game Plan'} />
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{gamePlan.descricao || gamePlan.observacoes}</p>
        </GlassCard>
      )}

      {obsCoach && (
        <GlassCard className="p-5 bg-gradient-to-br from-warning/[0.03] to-transparent border-warning/10">
          <BlocoHeader tipo="OBSERVACOES_COACH" titulo={obsCoach.titulo || 'Observacoes do Coach'} />
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{obsCoach.descricao || obsCoach.observacoes}</p>
        </GlassCard>
      )}
    </div>
  )
}
