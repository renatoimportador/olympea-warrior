import type { BlocoTreino } from '@/data/types'
import { getTipoBlocoLabel } from '@/lib/api'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Move, Flame, Star, Zap, Dumbbell, Target, MessageCircle, Youtube, Plus, Heart, Check } from 'lucide-react'
import { useState } from 'react'

const iconMap = { Move, Flame, Star, Zap, Dumbbell, Target, MessageCircle, Youtube, Plus, Heart, Check }

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

function BlocoHeader({ tipo, titulo, concluido }: { tipo: string; titulo: string; concluido: boolean }) {
  const label = getTipoBlocoLabel(tipo)
  const iconName = tipoParaIcone[tipo] || 'Move'
  const Icon = (iconMap as any)[iconName] || Move

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon size={16} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold text-text-primary transition-all ${concluido ? 'line-through opacity-60' : ''}`}>{titulo}</h3>
        <p className="text-[10px] text-text-secondary uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}

function ExerciciosList({ exercicios, concluido }: { exercicios: BlocoTreino['exercicios']; concluido?: boolean }) {
  if (!exercicios.length) return null
  return (
    <div className={`space-y-2 mt-2 transition-opacity ${concluido ? 'opacity-60' : ''}`}>
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
  const ordenados = [...blocos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())

  const toggleBloco = (id: string) => {
    setConcluidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const Checkbox = ({ id }: { id: string }) => {
    const marcado = concluidos.has(id)
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleBloco(id)
        }}
        className={`ml-2 w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
          marcado
            ? 'bg-accent border-accent text-black'
            : 'border-white/20 text-transparent hover:border-accent/50'
        }`}
        aria-label={marcado ? 'Desmarcar bloco' : 'Marcar bloco como concluido'}
        aria-pressed={marcado}
      >
        <Check size={14} strokeWidth={3} />
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {ordenados.map((b) => {
        if (b.tipo === 'WORKOUT') {
          const wod = wodProp || {
            tipo: 'WOD',
            nome: b.titulo || 'Workout (WOD)',
            descricao: b.descricao || '',
            time_cap: b.observacoes,
          }
          const marcado = concluidos.has(b.id)

          return (
            <GlassCard key={b.id} className={`p-5 bg-gradient-to-br from-accent/[0.04] to-transparent border-accent/10 transition-opacity ${marcado ? 'opacity-70' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Dumbbell size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold text-text-primary transition-all ${marcado ? 'line-through opacity-60' : ''}`}>{wod.nome || 'Workout (WOD)'}</h3>
                    <p className="text-[10px] text-accent uppercase tracking-wider font-medium">{wod.tipo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {wod.time_cap && <Badge variant="accent">Time Cap: {wod.time_cap}</Badge>}
                  <Checkbox id={b.id} />
                </div>
              </div>
              <p className={`text-sm text-text-secondary whitespace-pre-wrap leading-relaxed transition-opacity ${marcado ? 'opacity-60' : ''}`}>{wod.descricao}</p>
            </GlassCard>
          )
        }

        if (b.tipo === 'GAME_PLAN') {
          const marcado = concluidos.has(b.id)
          return (
            <GlassCard key={b.id} className={`p-5 transition-opacity ${marcado ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <BlocoHeader tipo="GAME_PLAN" titulo={b.titulo || 'Game Plan'} concluido={marcado} />
                </div>
                <Checkbox id={b.id} />
              </div>
              <p className={`text-sm text-text-secondary whitespace-pre-wrap leading-relaxed transition-opacity ${marcado ? 'opacity-60' : ''}`}>{b.descricao || b.observacoes}</p>
            </GlassCard>
          )
        }

        if (b.tipo === 'OBSERVACOES_COACH') {
          const marcado = concluidos.has(b.id)
          return (
            <GlassCard key={b.id} className={`p-5 bg-gradient-to-br from-warning/[0.03] to-transparent border-warning/10 transition-opacity ${marcado ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <BlocoHeader tipo="OBSERVACOES_COACH" titulo={b.titulo || 'Observacoes do Coach'} concluido={marcado} />
                </div>
                <Checkbox id={b.id} />
              </div>
              <p className={`text-sm text-text-secondary whitespace-pre-wrap leading-relaxed transition-opacity ${marcado ? 'opacity-60' : ''}`}>{b.descricao || b.observacoes}</p>
            </GlassCard>
          )
        }

        const marcado = concluidos.has(b.id)
        return (
          <GlassCard key={b.id} className={`p-5 transition-opacity ${marcado ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <BlocoHeader tipo={b.tipo} titulo={b.titulo} concluido={marcado} />
              </div>
              <Checkbox id={b.id} />
            </div>
            {b.descricao && <p className={`text-sm text-text-secondary mb-3 whitespace-pre-wrap transition-opacity ${marcado ? 'opacity-60' : ''}`}>{b.descricao}</p>}
            <ExerciciosList exercicios={b.exercicios} concluido={marcado} />
            {b.link_youtube && (
              <a href={b.link_youtube} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 mt-3 text-xs text-error hover:text-red-400 transition-colors">
                <Youtube size={12} /> Video do YouTube
              </a>
            )}
          </GlassCard>
        )
      })}
    </div>
  )
}
