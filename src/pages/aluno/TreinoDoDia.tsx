import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BlocoViewer } from '@/components/treino/BlocoViewer'
import { getTreinoByDia, getSemanaById, getFaseById, getDiaById, diasTreino } from '@/data/seed'
import { CalendarDays, ArrowRight, PlayCircle, Layers, Calendar } from 'lucide-react'

export function TreinoDoDia() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateTreinoId = (location.state as any)?.treinoId
  const notifDiaId = (location.state as any)?.diaTreinoId

  const [diaAtivo, setDiaAtivo] = useState(notifDiaId || diasTreino[0]?.id || '')

  useEffect(() => {
    if (notifDiaId) setDiaAtivo(notifDiaId)
  }, [notifDiaId])

  const dia = getDiaById(diaAtivo)
  const semana = dia ? getSemanaById(dia.semana_id) : undefined
  const fase = semana ? getFaseById(semana.fase_id) : undefined
  const treino = dia ? getTreinoByDia(dia.id) : undefined

  const dias = useMemo(() => {
    return diasTreino.map((d) => {
      const nomes = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sab', DOM: 'Dom' }
      return { id: d.id, label: (nomes as any)[d.dia_semana] || d.dia_semana }
    })
  }, [])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header com hierarquia */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-1">
          <Layers size={12} className="text-accent" />
          <span>{fase?.nome || 'Fase'}</span>
          <span>/</span>
          <Calendar size={12} />
          <span>{semana?.nome || 'Semana'}</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary">{treino?.titulo || 'Treino do Dia'}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="accent">CrossFit OLYMPEA</Badge>
          <Badge>{fase?.nome || 'Programacao'}</Badge>
        </div>
      </div>

      {/* Dias da semana */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {dias.map((d) => (
            <button
              key={d.id}
              onClick={() => setDiaAtivo(d.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                diaAtivo === d.id
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'bg-white/[0.02] text-text-secondary border border-white/[0.03] hover:text-text-primary'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Blocos */}
      {treino && treino.blocos ? (
        <>
          <BlocoViewer blocos={treino.blocos} wod={treino.wod} />

          {/* CTA Registrar Resultado */}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => navigate('/aluno/resultado', { state: { treinoId: treino.id, tituloTreino: treino.titulo } })}>
              <PlayCircle size={18} className="mr-2" />
              Registrar Resultado
            </Button>
            <Button variant="secondary" onClick={() => navigate('/aluno/historico')}>
              <ArrowRight size={18} />
            </Button>
          </div>
        </>
      ) : (
        <GlassCard className="p-8 text-center">
          <CalendarDays size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">Nenhum treino cadastrado para este dia.</p>
        </GlassCard>
      )}
    </div>
  )
}
