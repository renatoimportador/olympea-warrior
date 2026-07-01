import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import {
  getTreinoById,
  listarBlocosByTreino,
} from '@/lib/api'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import toast from 'react-hot-toast'

export function VisualizarTreino() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [treino, setTreino] = useState<any>(null)
  const [blocos, setBlocos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        if (!id) return

        const treinoData = await getTreinoById(id)
        const blocosData = await listarBlocosByTreino(id)

        setTreino(treinoData)
        setBlocos(
          (blocosData || []).sort((a, b) => a.ordem - b.ordem)
        )
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar treino')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [id])

  if (loading) {
    return <p>Carregando...</p>
  }

  if (!treino) {
    return <p>Treino não encontrado</p>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/admin/treinos')}>
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold">{treino.titulo}</h1>
      </div>

      {blocos.map((bloco) => (
        <GlassCard key={bloco.id} className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} />
            <h2 className="font-semibold">{bloco.titulo}</h2>
          </div>

          {bloco.descricao && (
            <p className="text-sm opacity-80">
              {bloco.descricao}
            </p>
          )}

          {bloco.exercicios?.length > 0 && (
            <div className="space-y-2">
              {bloco.exercicios.map((ex: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-white/5"
                >
                  <p>{ex.nome}</p>
                  {ex.reps && <p className="text-xs">Reps: {ex.reps}</p>}
                  {ex.carga && <p className="text-xs">Carga: {ex.carga}</p>}
                </div>
              ))}
            </div>
          )}

          {bloco.observacoes && (
            <div className="text-xs opacity-70">
              Obs: {bloco.observacoes}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  )
}
