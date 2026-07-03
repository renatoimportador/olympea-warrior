import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { getResultadoById, getTreinoById } from '@/lib/api'
import type { Resultado, Treino } from '@/data/types'
import { Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export function ResultadoDetalhe() {
  const { id: resultadoId } = useParams()

  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [treino, setTreino] = useState<Treino | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!resultadoId) {
  setLoading(false)
  return
}

      try {
        const res = await getResultadoById(resultadoId)
        setResultado(res)

        if (res?.treino_id) {
          const t = await getTreinoById(res.treino_id)
          setTreino(t)
        }
      } catch (e) {
        console.error(e)
        toast.error('Erro ao carregar resultado')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [resultadoId])

  if (loading) {
    return (
      <GlassCard className="p-6 text-center">
        Carregando...
      </GlassCard>
    )
  }

  if (!resultado) {
    return (
      <GlassCard className="p-6 text-center">
        Resultado não encontrado.
      </GlassCard>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      <div>
        <h1 className="text-2xl font-bold">
          {treino?.titulo || 'Treino'}
        </h1>

        <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
          <Calendar size={14} />
          {new Date(resultado.data).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <GlassCard className="p-5 space-y-4">

        <Badge>
          {resultado.categoria}
        </Badge>

        {resultado.tempo && (
          <div>
            <strong>Tempo</strong>
            <p>{resultado.tempo}</p>
          </div>
        )}

        {resultado.rounds !== undefined && (
          <div>
            <strong>Rounds</strong>
            <p>{resultado.rounds}</p>
          </div>
        )}

        {resultado.repeticoes !== undefined && (
          <div>
            <strong>Repetições</strong>
            <p>{resultado.repeticoes}</p>
          </div>
        )}

        {resultado.carga !== undefined && (
          <div>
            <strong>Carga</strong>
            <p>{resultado.carga} kg</p>
          </div>
        )}

        <div>
          <strong>RPE</strong>
          <p>{resultado.rpe}</p>
        </div>

        {resultado.reflexao && (
          <div>
            <strong>Como se sentiu</strong>
            <p>{resultado.reflexao}</p>
          </div>
        )}

        {resultado.meta_proxima && (
          <div>
            <strong>Meta para o próximo treino</strong>
            <p>{resultado.meta_proxima}</p>
          </div>
        )}

      </GlassCard>

    </div>
  )
}
