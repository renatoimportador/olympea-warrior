import { useEffect, useState } from 'react'
import type { BlocoTreino, ExercicioBloco, TipoBloco } from '@/data/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { getTipoBlocoLabel } from '@/data/seed'
import {
  Move, Flame, Star, Zap, Dumbbell, Target, MessageCircle,
  Plus, Trash2, ArrowUp, ArrowDown, Youtube, GripVertical,
} from 'lucide-react'

const iconMap: Record<string, React.FC<any>> = {
  Move, Flame, Star, Zap, Dumbbell, Target, MessageCircle, Youtube, Plus,
}

const tiposBloco: TipoBloco[] = ['MOBILIDADE', 'WARM_UP', 'SKILL', 'FORCA', 'WORKOUT', 'GAME_PLAN', 'OBSERVACOES_COACH', 'ACCESSORIES', 'CONDITIONING']

const tipoParaIcone: Record<TipoBloco, string> = {
  MOBILIDADE: 'Move', WARM_UP: 'Flame', SKILL: 'Star', FORCA: 'Zap',
  WORKOUT: 'Dumbbell', GAME_PLAN: 'Target', OBSERVACOES_COACH: 'MessageCircle',
  ACCESSORIES: 'Plus', CONDITIONING: 'Flame',
}

function novoExercicio(o = 0): ExercicioBloco {
  return {
    id: `ex-${Date.now()}-${o}`,
    nome: '',
    series: '',
    repeticoes: '',
    carga: '',
    percentual: '',
    tempo_descanso: '',
    link_youtube: '',
    observacoes: '',
    ordem: o
  }
}

function novoBloco(tipo: TipoBloco, o: number): BlocoTreino {
  return {
    id: `bl-${Date.now()}-${o}`,
    treino_id: '',
    tipo,
    titulo: getTipoBlocoLabel(tipo),
    descricao: '',
    exercicios: ['MOBILIDADE', 'WARM_UP', 'SKILL', 'FORCA', 'ACCESSORIES'].includes(tipo) ? [novoExercicio(0)] : [],
    link_youtube: '',
    observacoes: '',
    ordem: o,
    ativo: true,
  }
}

interface BlocoEditorProps {
  value: BlocoTreino[]
  onChange: (blocos: BlocoTreino[]) => void
}

export function BlocoEditor({ value, onChange }: BlocoEditorProps) {
  const [blocos, setBlocos] = useState<BlocoTreino[]>(value)
  useEffect(() => {
  setBlocos(value)
}, [value])
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => { onChange(blocos) }, [blocos, onChange])

  function atualizarBloco(id: string, patch: Partial<BlocoTreino>) {
    setBlocos(prev => prev.map(b => b.id === id ? { ...b, ...patch } as BlocoTreino : b))
  }
  function removerBloco(id: string) {
    setBlocos(prev => prev.filter(b => b.id !== id))
  }
  function moverBloco(id: string, d: number) {
    setBlocos(prev => {
      const i = prev.findIndex(b => b.id === id)
      if (i === -1 || (d < 0 && i === 0) || (d > 0 && i === prev.length - 1)) return prev
      const next = [...prev]
      const [removed] = next.splice(i, 1)
      next.splice(i + d, 0, removed)
      return next.map((b, idx) => ({ ...b, ordem: idx }))
    })
  }
  function addEx(blocoId: string) {
    setBlocos(prev => prev.map(b => {
      if (b.id !== blocoId) return b
      return { ...b, exercicios: [...b.exercicios, novoExercicio(b.exercicios.length)] }
    }))
  }
  function updEx(blocoId: string, exId: string, p: Partial<ExercicioBloco>) {
    setBlocos(prev => prev.map(b => {
      if (b.id !== blocoId) return b
      return { ...b, exercicios: b.exercicios.map(e => e.id === exId ? { ...e, ...p } as ExercicioBloco : e) }
    }))
  }
  function delEx(blocoId: string, exId: string) {
    setBlocos(prev => prev.map(b => {
      if (b.id !== blocoId) return b
      return { ...b, exercicios: b.exercicios.filter(e => e.id !== exId) }
    }))
  }

  return (
    <div className="space-y-4">
      {blocos.filter(b => b.ativo).map((bloco, idx) => {
        const exp = expandido === bloco.id
        const iconName = tipoParaIcone[bloco.tipo] || 'Move'
        const BlocoIcon = iconMap[iconName] || Move
        return (
          <GlassCard key={bloco.id} className={`p-4 space-y-3 transition-all ${exp ? 'border-accent/20' : ''}`}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => setExpandido(exp ? null : bloco.id)} className="flex items-center gap-2 flex-1 text-left">
                <GripVertical size={14} className="text-text-secondary" />
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BlocoIcon size={14} className="text-accent" />
                </div>
                <span className="text-sm font-medium text-text-primary">{bloco.titulo}</span>
                <span className="text-[10px] text-text-secondary">({getTipoBlocoLabel(bloco.tipo)})</span>
              </button>
              <div className="flex gap-1">
                <button onClick={() => moverBloco(bloco.id, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-white/[0.03] disabled:opacity-30">
                  <ArrowUp size={14} className="text-text-secondary" />
                </button>
                <button onClick={() => moverBloco(bloco.id, 1)} disabled={idx === blocos.length - 1} className="p-1.5 rounded-lg hover:bg-white/[0.03] disabled:opacity-30">
                  <ArrowDown size={14} className="text-text-secondary" />
                </button>
                <button onClick={() => removerBloco(bloco.id)} className="p-1.5 rounded-lg hover:bg-error/5">
                  <Trash2 size={14} className="text-error" />
                </button>
              </div>
            </div>

            {/* Conteudo expandido */}
            {exp && (
              <div className="space-y-4 pt-3 border-t border-white/[0.03]">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Titulo</label>
                  <Input value={bloco.titulo} onChange={e => atualizarBloco(bloco.id, { titulo: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Descricao</label>
                  <textarea rows={2} value={bloco.descricao || ''} onChange={e => atualizarBloco(bloco.id, { descricao: e.target.value })} className="glass-input w-full resize-none text-sm" />
                </div>
                {(bloco.tipo === 'GAME_PLAN' || bloco.tipo === 'OBSERVACOES_COACH') && (
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Texto completo</label>
                    <textarea rows={4} value={bloco.descricao || ''} onChange={e => atualizarBloco(bloco.id, { descricao: e.target.value, observacoes: e.target.value })} className="glass-input w-full resize-none text-sm" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-text-secondary block mb-1 flex items-center gap-1">
                    <Youtube size={12} className="text-error" /> Link YouTube
                  </label>
                  <Input value={bloco.link_youtube || ''} onChange={e => atualizarBloco(bloco.id, { link_youtube: e.target.value })} placeholder="https://youtube.com/..." />
                </div>

                {/* Exercicios */}
                {['MOBILIDADE', 'WARM_UP', 'SKILL', 'FORCA', 'ACCESSORIES', 'CONDITIONING'].includes(bloco.tipo) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-primary">Exercicios</span>
                      <button onClick={() => addEx(bloco.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs">
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                    {bloco.exercicios.map((ex, ei) => (
                      <div key={ex.id} className="p-3 rounded-xl bg-white/[0.02] space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-secondary">Ex {ei + 1}</span>
                          <button onClick={() => delEx(bloco.id, ex.id)} className="p-1 rounded hover:bg-error/5 ml-auto">
                            <Trash2 size={12} className="text-error" />
                          </button>
                        </div>
                        <Input value={ex.nome} onChange={e => updEx(bloco.id, ex.id, { nome: e.target.value })} placeholder="Nome do exercicio" className="text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={ex.series || ''} onChange={e => updEx(bloco.id, ex.id, { series: e.target.value })} placeholder="Series" className="text-sm" />
                          <Input value={ex.repeticoes || ''} onChange={e => updEx(bloco.id, ex.id, { repeticoes: e.target.value })} placeholder="Reps" className="text-sm" />
                          <Input value={ex.carga || ''} onChange={e => updEx(bloco.id, ex.id, { carga: e.target.value })} placeholder="Carga" className="text-sm" />
                          <Input value={ex.percentual || ''} onChange={e => updEx(bloco.id, ex.id, { percentual: e.target.value })} placeholder="%" className="text-sm" />
                        </div>
                        <Input value={ex.link_youtube || ''} onChange={e => updEx(bloco.id, ex.id, { link_youtube: e.target.value })} placeholder="Link YouTube" className="text-sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )
      })}

      {/* Adicionar bloco */}
      <div className="flex gap-2 flex-wrap">
        {tiposBloco.map(t => (
          <button key={t} onClick={() => setBlocos(prev => [...prev, novoBloco(t, prev.length)])}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs text-text-secondary hover:text-accent hover:border-accent/20 transition-all"
          >
            + {getTipoBlocoLabel(t)}
          </button>
        ))}
      </div>
    </div>
  )
}
