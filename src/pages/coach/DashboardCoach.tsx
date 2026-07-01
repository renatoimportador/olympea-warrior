import { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  Flame,
  CalendarCheck,
  AlertCircle,
  Star,
  ArrowUpRight,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  listarAlunos,
  listarResultadosByAluno,
  getFrequenciasByAluno,
  getPRsByAluno,
} from '@/lib/api'
import type {
  Aluno,
  Resultado,
  PersonalRecord,
  Frequencia,
} from '@/data/types'
import { useNavigate } from 'react-router-dom'

export function DashboardCoach() {
  const navigate = useNavigate()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [frequencias, setFrequencias] = useState<Frequencia[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {
    try {
      const alunosData = await listarAlunos()
      const alunosAtivos = (alunosData || []).filter((a) => a.ativo)

      setAlunos(alunosAtivos)

      const todosResultados: Resultado[] = []
      const todasFrequencias: Frequencia[] = []
      const todosPRs: PersonalRecord[] = []

      for (const aluno of alunosAtivos) {
        const [resultadosAluno, frequenciasAluno, prsAluno] =
          await Promise.all([
            listarResultadosByAluno(aluno.id),
            getFrequenciasByAluno(aluno.id),
            getPRsByAluno(aluno.id),
          ])

        todosResultados.push(...(resultadosAluno || []))
        todasFrequencias.push(...(frequenciasAluno || []))
        todosPRs.push(...(prsAluno || []))
      }

      setResultados(
        todosResultados.sort(
          (a: any, b: any) =>
            new Date(b.created_at || b.data).getTime() -
            new Date(a.created_at || a.data).getTime()
        )
      )

      setFrequencias(todasFrequencias)

      setPersonalRecords(
        todosPRs.sort(
          (a: any, b: any) =>
            new Date(b.data).getTime() -
            new Date(a.data).getTime()
        )
      )
    } catch (error) {
      console.error('Erro ao carregar dashboard coach:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAlunos = alunos.length

  const freqTotal = frequencias.filter((f) => f.presente).length

  const freqMedia =
    totalAlunos > 0 ? (freqTotal / totalAlunos).toFixed(1) : '0'

  const recentPRs = personalRecords.slice(0, 3)

  const ultimosResultados = resultados.slice(0, 5)

  const alunosSemRegistro = alunos.filter((a) => {
    return !resultados.some((r) => r.aluno_id === a.id)
  })

  const alunosStats = [
    {
      label: 'Total Alunos',
      value: String(totalAlunos),
      icon: Users,
      change: 'ativos',
    },
    {
      label: 'Frequência Média',
      value: String(freqMedia),
      icon: CalendarCheck,
      change: 'por atleta',
    },
    {
      label: 'Resultados',
      value: String(resultados.length),
      icon: TrendingUp,
      change: 'registrados',
    },
    {
      label: 'PRs',
      value: String(personalRecords.length),
      icon: Flame,
      change: 'conquistados',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">
          Dashboard do Coach
        </h1>
        <p className="text-text-secondary">Carregando dados...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">
          Dashboard do Coach
        </h1>
        <p className="text-text-secondary">
          Visão dos seus alunos vinculados
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {alunosStats.map((s) => {
          const Icon = s.icon

          return (
            <GlassCard key={s.label} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center">
                  <Icon size={16} className="text-accent" />
                </div>

                <span className="text-xs font-medium text-success flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> {s.change}
                </span>
              </div>

              <div>
                <p className="text-xl font-bold text-text-primary">
                  {s.value}
                </p>
                <p className="text-xs text-text-secondary">
                  {s.label}
                </p>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-warning" />
            <h2 className="font-semibold text-text-primary">
              Últimos PRs
            </h2>
          </div>

          <div className="space-y-2">
            {recentPRs.length > 0 ? (
              recentPRs.map((pr) => {
                const aluno = alunos.find(
                  (a) => a.id === pr.aluno_id
                )

                return (
                  <div
                    key={pr.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Star size={14} className="text-accent" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {aluno?.nome || 'Aluno'}
                        </p>

                        <p className="text-xs text-text-secondary">
                          {pr.valor}
                          {pr.unidade}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-text-secondary">
                      {new Date(pr.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-text-secondary text-center py-4">
                Nenhum PR registrado.
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-error" />
            <h2 className="font-semibold text-text-primary">
              Alunos Sem Registro
            </h2>
          </div>

          <div className="space-y-2">
            {alunosSemRegistro.length > 0 ? (
              alunosSemRegistro.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]"
                >
                  <span className="text-sm text-text-primary">
                    {a.nome}
                  </span>

                  <Badge variant="error">
                    Sem resultado
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary text-center py-4">
                Todos os alunos registraram resultados!
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-success" />
            <h2 className="font-semibold text-text-primary">
              Últimos Resultados
            </h2>
          </div>

          <button
            onClick={() => navigate('/coach/resultados')}
            className="text-xs text-accent hover:underline"
          >
            Ver todos
          </button>
        </div>

        <div className="space-y-2">
          {ultimosResultados.length > 0 ? (
            ultimosResultados.map((r) => {
              const aluno = alunos.find(
                (a) => a.id === r.aluno_id
              )

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">
                        {aluno?.nome?.charAt(0) || 'A'}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-text-primary">
                        {aluno?.nome || 'Aluno'}
                      </p>

                      <p className="text-xs text-text-secondary">
                        {r.tempo || r.carga || r.rounds || '--'} — RPE {r.rpe}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      r.categoria === 'RX'
                        ? 'accent'
                        : r.categoria === 'SCALING'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {r.categoria}
                  </Badge>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">
              Nenhum resultado encontrado.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
