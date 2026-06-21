import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getAlunoByUsuarioId, getFrequenciasByAluno } from '@/data/seed'
import { GlassCard } from '@/components/ui/GlassCard'
import { CalendarCheck, Check, Clock, Flame } from 'lucide-react'

const diasDaSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Heatmap mock
const heatmapData = Array.from({ length: 30 }, (_, i) => ({
  dia: i + 1,
  presente: [1,3,5,6,8,10,12,13,15,17,19,20,22,24,26,27,29].includes(i+1),
}))

export function MinhaFrequencia() {
  const { user } = useAuth()
  const aluno = user ? getAlunoByUsuarioId(user.id) : undefined
  const frequencias = aluno ? getFrequenciasByAluno(aluno.id) : []

  const presencas = useMemo(() => frequencias.filter((f) => f.presente).length, [frequencias])
  const taxaPresenca = frequencias.length > 0 ? Math.round((presencas / frequencias.length) * 100) : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Minha Frequencia</h1>
        <p className="text-sm text-text-secondary">Acompanhamento de presenca</p>
      </div>

      {/* Metricas */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center space-y-1">
          <CalendarCheck size={18} className="mx-auto text-accent" />
          <p className="text-xl font-bold text-text-primary">{presencas}</p>
          <p className="text-[10px] text-text-secondary">Presencas</p>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <Check size={18} className="mx-auto text-success" />
          <p className="text-xl font-bold text-text-primary">{taxaPresenca}%</p>
          <p className="text-[10px] text-text-secondary">Taxa</p>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <Flame size={18} className="mx-auto text-warning" />
          <p className="text-xl font-bold text-text-primary">5</p>
          <p className="text-[10px] text-text-secondary">Streak</p>
        </GlassCard>
      </div>

      {/* Heatmap */}
      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <CalendarCheck size={16} className="text-accent" />
          Heatmap do Mes
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {diasDaSemana.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-text-secondary">{d}</div>
          ))}
          {heatmapData.map((d) => (
            <div
              key={d.dia}
              className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium ${
                d.presente
                  ? 'bg-accent/20 text-accent border border-accent/10'
                  : 'bg-white/[0.02] text-text-secondary border border-white/[0.03]'
              }`}
            >
              {d.dia}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
          <span className="text-[10px] text-text-secondary">Status</span>
          <div className="w-3 h-3 rounded bg-white/[0.02] border border-white/[0.03]" />
          <span className="text-[10px] text-text-secondary">Ausente</span>
          <div className="w-3 h-3 rounded bg-accent/20 border border-accent/10" />
          <span className="text-[10px] text-text-secondary">Presente</span>
        </div>
      </GlassCard>

      {/* Historico */}
      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Clock size={16} className="text-accent" />
          Historico
        </h3>
        <div className="space-y-2">
          {frequencias.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">
              Nenhuma frequencia registrada ainda
            </p>
          )}
          {frequencias.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-text-primary">{f.data}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${f.presente ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {f.presente ? 'Presente' : 'Falta'}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
