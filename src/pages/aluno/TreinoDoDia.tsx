import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { BlocoViewer } from '@/components/treino/BlocoViewer'
import {
  listarTreinosByDia,
  getSemanaById,
  getFaseById,
  getDiaById,
  diasTreino
} from '@/data/seed'
import { Layers, Calendar } from 'lucide-react'

export function TreinoDoDia() {
  const navigate = useNavigate()
  const location = useLocation()

  const stateTreinoId = (location.state as any)?.treinoId
  const notifDiaId = (location.state as any)?.diaTreinoId

  const [diaAtivo, setDiaAtivo] = useState(
    notifDiaId || diasTreino[0]?.id || ''
  )

  useEffect(() => {
    if (notifDiaId) setDiaAtivo(notifDiaId)
  }, [notifDiaId])

  const dia = getDiaById(diaAtivo)
  const semana = dia ? getSemanaById(dia.semana_id) : undefined
  const fase = semana ? getFaseById(semana.fase_id) : undefined

  // ALTERAÇÃO PRINCIPAL AQUI
  const treino = dia ? listarTreinosByDia(dia.id)[0] : undefined

  const dias = useMemo(() => {
    const nomes = {
      SEG: 'Seg',
      TER: 'Ter',
      QUA: 'Qua',
      QUI: 'Qui',
      SEX: 'Sex',
      SAB: 'Sab',
      DOM: 'Dom',
    }

    return diasTreino.map((d) => ({
      id: d.id,
      label: (nomes as any)[d.dia_semana] || d.dia_semana,
    }))
  }, [])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-1">
          <Layers size={12} className="text-accent" />
          <span>{fase?.nome || 'Fase'}</span>
          <span>/</span>
          <Calendar size={12} />
          <span>{semana?.nome || 'Semana'}</span>
        </div>

        <h1 className="text-xl font-bold text-text-primary">
          {treino?.titulo || 'Treino do Dia'}
        </h1>

        <div className="flex items-center gap-2 mt-1">
          <Badge variant="accent">CrossFit OLYMPEA</Badge>
          <Badge>{fase?.nome || 'Programacao'}</Badge>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dias.map((d) => (
          <button
            key={d.id}
            onClick={() => setDiaAtivo(d.id)}
            className={`px-4 py-2 rounded-xl transition ${
              diaAtivo === d.id
                ? 'bg-accent text-black font-semibold'
                : 'bg-card text-text-secondary'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Conteúdo do treino */}
      {treino ? (
  <div className="space-y-4">
    <BlocoViewer blocos={treino.blocos || []} />
  </div>
) : (
  <div className="text-center text-text-secondary py-10">
    Nenhum treino encontrado para este dia.
  </div>
      )}
    </div>
  )
}
