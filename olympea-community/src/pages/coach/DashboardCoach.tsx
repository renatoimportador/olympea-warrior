import { useState, useEffect } from 'react'
import {
  Users, TrendingUp, Flame, CalendarCheck, AlertCircle,
  Star, ArrowUpRight,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  listarAlunos, listarResultadosByAluno, getFrequenciasByAluno, getPRsByAluno,
} from '@/lib/api'
import type { Aluno, Resultado, PersonalRecord, Frequencia } from '@/data/types'
import { useNavigate } from 'react-router-dom'

export function DashboardCoach() {
  const navigate = useNavigate()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [frequencias, setFrequencias] = useState<Frequencia[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const a = await listarAlunos()
        setAlunos(a)

        const allResultados: Resultado[] = []
        const allFreqs: Frequencia[] = []
        const allPRs: PersonalRecord[] = []

        for (const al of a) {
          const [r, f, p] = await Promise.all([
            listarResultadosByAluno(al.id),
            getFrequenciasByAluno(al.id),
            getPRsByAluno(al.id),
          ])
          allResultados.push(...r)
          allFreqs.push(...f)
          allPRs.push(...p)
        }

        setResultados(allResultados)
        setFrequencias(allFreqs)
        setPersonalRecords(allPRs)
      } catch (e) {
        console.error('Erro ao carregar dashboard coach:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalAlunos = alunos.filter((a) => a.ativo).length
  const alunosAtivos = alunos.filter((a) => a.ativo).length
  const alunosInativos = alunos.length - alunosAtivos
  const freqTotal = frequencias.filter((f) => f.presente).length
  const freqMedia = totalAlunos > 0 ? (freqTotal / totalAlunos).toFixed(1) : '0'
  const recentPRs = personalRecords.slice(-3).reverse()
  const ultimosResultados = resultados.slice(-5).reverse()
  const alunosSemRegistro = alunos.filter((a) => {
    const temResultado = resultados.some((r) => r.aluno_id === a.id)
    return a.ativo && !temResultado
  })

  const alunosStats = [
    { label: 'Total Alunos', value: String(totalAlunos), icon: Users, change: 'ativos' },
    { label: 'Frequencia Media', value: String(freqMedia), icon: CalendarCheck, change: 'por atleta' },
    { label: 'Resultados', value: String(resultados.length), icon: TrendingUp, change: 'registrados' },
    { label: 'PRs', value: String(personalRecords.length), icon: Flame, change: 'conquistados' },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Dashboard do Coach</h1>
          <p className="text-text-secondary">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard do Coach</h1>
        <p className="text-text-secondary">Visao dos seus alunos vinculados</p>
      </div>

      {/* Stats */}
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
                <p className="text-xl font-bold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-secondary">{s.label}</p>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performances */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-warning" />
            <h2 className="font-semibold text-text-primary">Ultimos PRs</h2>
          </div>
          <div className="space-y-2">
            {recentPRs.length > 0 ? recentPRs.map((pr) => {
              const aluno = alunos.find((a) => a.id === pr.aluno_id)
              return (
                <div key={pr.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Star size={14} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{aluno?.nome || aluno?.usuario?.nome || 'Aluno'}</p>
                      <p className="text-xs text-text-secondary">{pr.valor}{pr.unidade}</p>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary">{new Date(pr.data).toLocaleDateString('pt-BR')}</span>
                </div>
              )
            }) : (
              <p className="text-sm text-text-secondary text-center py-4">Nenhum PR registrado.</p>
            )}
          </div>
        </GlassCard>

        {/* Alunos sem registro */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-error" />
            <h2 className="font-semibold text-text-primary">Alunos Sem Registro</h2>
          </div>
          <div className="space-y-2">
            {alunosSemRegistro.length > 0 ? alunosSemRegistro.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-sm text-text-primary">{a.nome || a.usuario?.nome || 'Aluno'}</span>
                <Badge variant="error">Sem resultado</Badge>
              </div>
            )) : (
              <p className="text-sm text-text-secondary text-center py-4">Todos os alunos registraram resultados!</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Ultimos resultados */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-success" />
            <h2 className="font-semibold text-text-primary">Ultimos Resultados</h2>
          </div>
          <button onClick={() => navigate('/coach/resultados')} className="text-xs text-accent hover:underline">
            Ver todos
          </button>
        </div>
        <div className="space-y-2">
          {ultimosResultados.map((r) => {
            const aluno = alunos.find((a) => a.id === r.aluno_id)
            return (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                    <span className="text-xs font-bold text-accent">{(aluno?.nome || aluno?.usuario?.nome)?.charAt(0) || 'A'}</span>
                  </div>
                  <div>
                    <p className="text-sm text-text-primary">{aluno?.nome || aluno?.usuario?.nome || 'Aluno'}</p>
                    <p className="text-xs text-text-secondary">
                      {r.tempo || `${r.carga || r.rounds || '--'} `} — RPE {r.rpe}
                    </p>
                  </div>
                </div>
                <Badge variant={r.categoria === 'RX' ? 'accent' : r.categoria === 'SCALING' ? 'warning' : 'success'}>
                  {r.categoria}
                </Badge>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
