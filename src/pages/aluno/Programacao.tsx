import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { fases, semanas, diasTreino } from '@/data/seed'
import { Layers, Calendar, ChevronRight } from 'lucide-react'

export function Programacao() {
  const navigate = useNavigate()
  const [faseAtiva, setFaseAtiva] = useState<string | null>('f-1')
  const [semanaAtiva, setSemanaAtiva] = useState<string | null>('s-1')

  const fasesProg = fases.filter((f) => f.programacao_id === 'prog-1' && f.ativa)
  const semanasFase = semanas.filter((s) => s.fase_id === faseAtiva && s.ativa)
  const diasSemana = diasTreino.filter((d) => d.semana_id === semanaAtiva)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Programacao</h1>
        <p className="text-sm text-text-secondary">CrossFit OLYMPEA - Revolucao</p>
      </div>

      {/* Fases */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <Layers size={14} className="text-accent" />
          Fases
        </h2>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {fasesProg.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFaseAtiva(f.id); setSemanaAtiva(null) }}
              className={`flex-shrink-0 p-4 rounded-2xl border transition-all text-left space-y-1 min-w-[140px] ${
                faseAtiva === f.id
                  ? 'bg-accent/5 border-accent/20'
                  : 'bg-white/[0.02] border-white/[0.05]'
              }`}
            >
              <p className="text-sm font-semibold text-text-primary">{f.nome}</p>
              <p className="text-[10px] text-text-secondary">{f.duracao_semanas} semanas</p>
            </button>
          ))}
        </div>
      </div>

      {/* Semanas */}
      {semanasFase.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Calendar size={14} className="text-accent" />
            Semanas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {semanasFase.map((s) => (
              <button
                key={s.id}
                onClick={() => setSemanaAtiva(s.id)}
                className={`p-3 rounded-xl border transition-all text-left space-y-1 ${
                  semanaAtiva === s.id
                    ? 'bg-accent/5 border-accent/20'
                    : 'bg-white/[0.02] border-white/[0.05]'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{s.nome}</p>
                <p className="text-[10px] text-text-secondary">{s.tipo}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dias */}
      {semanaAtiva && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-text-secondary">Dias de Treino</h2>
          <div className="space-y-2">
            {diasSemana.map((d) => (
              <GlassCard
                key={d.id}
                className="p-4 flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate('/aluno/treino')}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{d.dia_semana}</p>
                  <p className="text-xs text-text-secondary">{d.data}</p>
                </div>
                <Badge variant="success">Liberado</Badge>
                <ChevronRight size={16} className="text-text-secondary group-hover:text-accent transition-colors" />
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
