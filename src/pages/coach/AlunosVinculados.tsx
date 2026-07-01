import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { listarAlunos } from '@/lib/api'
import { TrendingUp, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function AlunosVinculados() {
  const navigate = useNavigate()

  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarAlunos()
  }, [])

  async function carregarAlunos() {
    try {
      const data = await listarAlunos()

      const ativos = (data || []).filter((a: any) => a.ativo)

      setAlunos(ativos)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Alunos Vinculados
        </h1>

        <p className="text-sm text-text-secondary">
          {alunos.length} alunos sob sua responsabilidade
        </p>
      </div>

      {loading ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-text-secondary">Carregando alunos...</p>
        </GlassCard>
      ) : alunos.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-text-secondary">
            Nenhum aluno encontrado
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {alunos.map((a) => (
            <GlassCard
              key={a.id}
              className="p-4 flex items-center gap-4 cursor-pointer group"
              onClick={() => navigate(`/coach/evolucao?aluno=${a.id}`)}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center font-bold text-accent">
                {a.nome?.charAt(0) || 'A'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {a.nome}
                </p>
                <p className="text-xs text-text-secondary">
                  {a.email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-text-secondary">
                    Categoria
                  </p>

                  <Badge
                    variant={
                      a.categoria === 'RX'
                        ? 'accent'
                        : a.categoria === 'SCALING'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {a.categoria || 'BEGINNER'}
                  </Badge>
                </div>

                <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                  <TrendingUp
                    size={16}
                    className="text-text-secondary"
                  />
                </div>
              </div>

              <ChevronRight
                size={18}
                className="text-text-secondary group-hover:text-accent transition-colors"
              />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
