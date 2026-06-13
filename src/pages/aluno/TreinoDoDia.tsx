import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { BlocoViewer } from '@/components/treino/BlocoViewer'
import {
  listarDiasBySemana,
  listarSemanasByFase,
  listarFasesByProg,
  getTreinoCompletoByDia,
} from '@/lib/api'
import { useProgramacao } from '@/context/ProgramacaoContext'
import { Layers, Calendar } from 'lucide-react'

export function TreinoDoDia() {
  const location = useLocation()
  const { programacaoAtiva } = useProgramacao()

  const notifDiaId = (location.state as any)?.diaTreinoId

  const [dias, setDias] = useState<any[]>([])
  const [diaAtivo, setDiaAtivo] = useState('')
  const [treino, setTreino] = useState<any>(null)
  const [fase, setFase] = useState<any>(null)
  const [semana, setSemana] = useState<any>(null)

  useEffect(() => {
    async function load() {
      if (!programacaoAtiva) return

      const fases = await listarFasesByProg(programacaoAtiva.id)
      if (!fases.length) return

      const faseAtual = fases[0]
      setFase(faseAtual)

      const semanas = await listarSemanasByFase(faseAtual.id)
      if (!semanas.length) return

      const semanaAtual = semanas[0]
      setSemana(semanaAtual)

      const diasSemana = await listarDiasBySemana(semanaAtual.id)
      setDias(diasSemana)

      const diaSelecionado = notifDiaId || diasSemana[0]?.id
      if (diaSelecionado) {
        setDiaAtivo(diaSelecionado)

        const treinoCompleto = await getTreinoCompletoByDia(diaSelecionado)
        setTreino(treinoCompleto)
      }
    }

    load()
  }, [programacaoAtiva, notifDiaId])

  async function trocarDia(diaId: string) {
    setDiaAtivo(diaId)

    const treinoCompleto = await getTreinoCompletoByDia(diaId)
    setTreino(treinoCompleto)
  }

  const diasFormatados = useMemo(() => {
    const nomes = {
      SEG: 'Seg',
      TER: 'Ter',
      QUA: 'Qua',
      QUI: 'Qui',
      SEX: 'Sex',
      SAB: 'Sab',
      DOM: 'Dom',
    }

    return dias.map((d) => ({
      id: d.id,
      label: (nomes as any)[d.dia_semana] || d.dia_semana,
    }))
  }, [dias])

  return (
    <div className="space-y-5 animate-fade-in">
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

      <div className="flex gap-2 overflow-x-auto pb-2">
        {diasFormatados.map((d) => (
          <button
            key={d.id}
            onClick={() => trocarDia(d.id)}
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
