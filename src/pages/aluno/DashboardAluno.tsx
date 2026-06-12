import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useProgramacao } from '@/context/ProgramacaoContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  getAlunoByUsuarioId, getPRsByAluno, getFrequenciasByAluno,
  listarResultadosByAluno, getProgramacoesByAluno,
  listarDiasBySemana, getTreinoCompletoByDia,
} from '@/lib/api'
import type { Aluno, PersonalRecord, Frequencia, Resultado, Programacao, DiaTreino, Treino } from '@/data/types'
import {
  Zap, TrendingUp, CalendarCheck, Dumbbell, Flame, Trophy,
  ChevronRight, Clock, ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export function DashboardAluno() {
  const { user } = useAuth()
  const { programacaoAtiva } = useProgramacao()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [prs, setPRs] = useState<PersonalRecord[]>([])
  const [frequencias, setFrequencias] = useState<Frequencia[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [diasTreino, setDiasTreino] = useState<DiaTreino[]>([])
  const [treinoHoje, setTreinoHoje] = useState<Treino | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      try {
        const a = await getAlunoByUsuarioId(user.id)
        if (!a) { setLoading(false); return }
        setAluno(a)

        const [p, f, r, progs] = await Promise.all([
          getPRsByAluno(a.id),
          getFrequenciasByAluno(a.id),
          listarResultadosByAluno(a.id),
          getProgramacoesByAluno(a.id),
        ])
        setPRs(p)
        setFrequencias(f)
        setResultados(r)
        setProgramacoes(progs)

        // Buscar dias da semana da programacao ativa
        if (programacaoAtiva?.id) {
          // Buscar fases da programacao
          const { listarFasesByProg } = await import('@/lib/api')
          const fases = await listarFasesByProg(programacaoAtiva.id)
          if (fases.length > 0) {
            const { listarSemanasByFase } = await import('@/lib/api')
            const semanas = await listarSemanasByFase(fases[0].id)
            if (semanas.length > 0) {
              const { listarDiasBySemana } = await import('@/lib/api')
              const dias = await listarDiasBySemana(semanas[0].id)
              setDiasTreino(dias)

              // Buscar treino do dia atual
              const hoje = new Date()
              const semanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
              const diaSemana = semanaNomes[hoje.getDay()]
              const diaAtual = dias.find(d => d.dia_semana === diaSemana.toUpperCase())
              if (diaAtual) {
                const treino = await getTreinoCompletoByDia(diaAtual.id)
                setTreinoHoje(treino)
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro ao carregar dashboard aluno:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, programacaoAtiva])

  const streak = useMemo(() => {
    if (frequencias.length === 0) return 0
    const sorted = [...frequencias].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    let count = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].data)
      const curr = new Date(sorted[i].data)
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
      if (diff <= 2) count++
      else break
    }
    return count
  }, [frequencias])

  const freqMes = frequencias.length
  const treinosTotal = resultados.length
  const pesoAtual = aluno?.peso_atual ?? 0
  const hoje = new Date()
  const semanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const diaSemana = semanaNomes[hoje.getDay()]
  const dataHoje = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  const frequenciaData = semanaNomes.map(nome => ({
    name: nome,
    freq: frequencias.filter(f => {
      const d = new Date(f.data)
      return semanaNomes[d.getDay()] === nome
    }).length
  }))

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-text-primary">Ola, {user?.nome?.split(' ')[0] || 'Aluno'}!</h1>
          <p className="text-text-secondary">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header com perfil */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-xl">
          {user?.nome?.charAt(0) || 'A'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Ola, {user?.nome?.split(' ')[0] || 'Aluno'}!</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="accent">{aluno?.categoria || 'BEGINNER'}</Badge>
            <span className="text-xs text-text-secondary">{programacaoAtiva?.nome || ''}</span>
          </div>
        </div>
      </div>

      {/* Streak banner */}
      <div className="glass-card p-4 flex items-center justify-between bg-gradient-to-r from-accent/5 to-transparent border-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Flame size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Streak de {streak} treinos!</p>
            <p className="text-xs text-text-secondary">Voce esta treinando consistentemente</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-text-secondary" />
      </div>

      {/* Metricas Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <CalendarCheck size={16} className="text-success" />
            <ArrowUpRight size={14} className="text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{freqMes}</p>
            <p className="text-xs text-text-secondary">Frequencia mes</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Dumbbell size={16} className="text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{treinosTotal}</p>
            <p className="text-xs text-text-secondary">Treinos totais</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Zap size={16} className="text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{prs.length}</p>
            <p className="text-xs text-text-secondary">PRs</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <TrendingUp size={16} className="text-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{pesoAtual}kg</p>
            <p className="text-xs text-text-secondary">Peso atual</p>
          </div>
        </GlassCard>
      </div>

      {/* Proximo Treino */}
      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-accent" />
            <h2 className="font-semibold text-text-primary">Proximo Treino</h2>
          </div>
          <span className="text-xs text-text-secondary">{diaSemana}, {dataHoje}</span>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">{treinoHoje?.titulo || 'Sem treino programado para hoje'}</p>
          {treinoHoje ? (
            <>
              <p className="text-xs text-text-secondary">{programacaoAtiva?.nome || ''}</p>
              <div className="flex gap-2 pt-1">
                {['RX', 'Scaling', 'Beginner'].map((n) => (
                  <span key={n} className="px-2 py-1 rounded-lg bg-white/[0.03] text-xs text-text-secondary border border-white/[0.05]">
                    {n}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-secondary">Aproveite o dia de descanso e recupere bem!</p>
          )}
        </div>
      </GlassCard>

      {/* Grafico de Frequencia */}
      <GlassCard className="p-5 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <CalendarCheck size={16} className="text-accent" />
          Frequencia Semanal
        </h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={frequenciaData}>
              <defs>
                <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131C25',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="freq" stroke="#00E5FF" strokeWidth={2} fill="url(#freqGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* PRs Recentes */}
      <GlassCard className="p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-warning" />
          PRs Recentes
        </h2>
        {prs.length > 0 ? (
          <div className="space-y-2">
            {prs.slice(0, 3).map((pr) => (
              <div key={pr.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Zap size={14} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{pr.exercicio_nome || 'Exercicio'}</p>
                    <p className="text-xs text-text-secondary">{new Date(pr.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-accent">{pr.valor}{pr.unidade}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Nenhum PR registrado ainda. Vamos comecar!</p>
        )}
      </GlassCard>

      {/* Multi-Programacao */}
      <GlassCard className="p-5 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <CalendarCheck size={16} className="text-success" />
          Minhas Programacoes
        </h2>
        <div className="space-y-2">
          {programacoes.map((prog) => (
            <div key={prog.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div>
                <p className="text-sm font-medium text-text-primary">{prog.nome}</p>
                <p className="text-xs text-text-secondary">{prog.tipo}</p>
              </div>
              <Badge variant={prog.ativa ? 'success' : 'default'}>
                {prog.ativa ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
